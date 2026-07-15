// API REST de AUTOCELLS (Express + SQLite vía node:sqlite).
// En dev, Vite hace proxy de /api hacia este servidor (ver vite.config.js);
// el frontend siempre llama con apiUrl() de src/lib/api.js.
import { randomBytes } from 'node:crypto';
import { promises as dns } from 'node:dns';
import express from 'express';
import compression from 'compression';
import { db, generateFolio, todayKey } from './db.js';
import { isMailerConfigured, sendVerificationEmail, sendPasswordResetEmail, publicUrl } from './mailer.js';
import {
  hashPassword,
  verifyPassword,
  isHashed,
  createSession,
  deleteSession,
  getSessionUser,
  requireAuth,
  requireAdmin,
  requireSelfOrAdmin,
} from './auth.js';
// Límite de intentos en los endpoints sensibles (fallos de login, envíos de
// correo, citas y pedidos). Contadores en SQLite: ver server/rateLimit.js.
import { isLimited, record, clear, clientIp, LIMIT_MESSAGE } from './rateLimit.js';
import { slugify } from '../src/lib/slugify.js';
// Mismas reglas que validan los formularios: el backend nunca confía en que
// el cliente ya validó (se puede llamar al API directo con datos basura).
import {
  validatePersonName,
  validateEmail,
  validatePhone,
  validatePassword,
  validateDevice,
  validateProductName,
  validateDescription,
  validatePrice,
  validateStock,
  LIMITS,
} from '../src/lib/validation.js';

const PORT = process.env.PORT ?? 3001;
const app = express();
// gzip en las respuestas: el catálogo viaja con fotos en base64 y sin
// comprimir cada visitante descargaría megabytes (Express además manda ETag,
// así que las recargas sin cambios regresan 304 sin cuerpo).
app.use(compression());
// Límite alto: las fotos de producto viajan como data URLs dentro del JSON
// (el default de 100kb rechazaría cualquier imagen real con un 413).
app.use(express.json({ limit: '25mb' }));

// Las carreras de concurrencia (dos registros con el mismo correo, dos citas
// en el mismo horario, dos pedidos con el mismo folio) se resuelven dejando
// que la base rechace el duplicado — los "SELECT antes de INSERT" de los
// endpoints solo dan mensajes bonitos, no son atómicos entre procesos.
function isUniqueViolation(error) {
  return typeof error?.message === 'string' && error.message.includes('UNIQUE constraint failed');
}

const api = express.Router();

// ---------- Usuarios ----------

function publicUser(row) {
  // Nunca regresar el password ni los tokens/códigos al cliente.
  return {
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role ?? 'user',
    verified: Boolean(row.verified),
    createdAt: row.created_at,
  };
}

// Vigencia del enlace de verificación de correo.
const VERIFY_TOKEN_HOURS = 24;

// Segunda capa de validación de correo, solo del server (el navegador no
// puede consultar DNS): si el dominio no tiene registros MX, el correo de
// verificación no puede llegar jamás (typos tipo "gmial.com" o dominios
// inventados). Si el buzón existe DENTRO de un dominio real (Gmail no lo
// revela) no se puede saber de antemano — eso lo resuelve el propio enlace
// de verificación: una cuenta con correo falso nunca se verifica ni compra.
async function emailDomainAcceptsMail(email) {
  const domain = email.slice(email.lastIndexOf('@') + 1);
  try {
    return (await dns.resolveMx(domain)).length > 0;
  } catch (error) {
    // ENOTFOUND/ENODATA = el dominio no existe o no recibe correo. Cualquier
    // otro error (timeout del DNS) deja pasar: rechazar registros válidos por
    // una falla temporal del resolver sería peor.
    return error.code !== 'ENOTFOUND' && error.code !== 'ENODATA';
  }
}

// Genera y guarda un token nuevo (invalida el anterior), manda el correo y
// regresa lo que el endpoint debe adjuntar a su respuesta. Sin SMTP (dev), el
// enlace viaja como devVerifyUrl para que la interfaz lo muestre.
async function issueVerification(email, name) {
  const token = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + VERIFY_TOKEN_HOURS * 60 * 60 * 1000).toISOString();
  db.prepare('UPDATE users SET verify_token = ?, verify_expires = ? WHERE email = ?').run(token, expires, email);

  const verifyUrl = `${publicUrl}/verificar-correo?token=${token}`;
  try {
    const { sent } = await sendVerificationEmail({ to: email, name, verifyUrl });
    return { mailSent: sent, ...(sent ? {} : { devVerifyUrl: verifyUrl }) };
  } catch (error) {
    // El SMTP falló: la cuenta ya existe y el usuario puede pedir el reenvío.
    console.error('No se pudo enviar el correo de verificación:', error);
    return { mailSent: false };
  }
}

// Los datos de una cuenta (teléfono incluido) solo los ve su dueño o el admin.
api.get('/usuarios/:email', requireSelfOrAdmin, (req, res) => {
  const row = db
    .prepare('SELECT * FROM users WHERE email = ?')
    .get(req.params.email.toLowerCase());
  if (!row) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(publicUser(row));
});

api.post('/usuarios', async (req, res) => {
  const { name, email, phone, password } = req.body ?? {};
  // Cada registro manda un correo de verificación: 5 por hora por IP cuidan
  // la cuota del SMTP (el consumo se cobra abajo, cuando el registro procede).
  const registerBucket = `registro:${clientIp(req)}`;
  if (isLimited(registerBucket, 5, 60)) {
    return res.status(429).json({ error: LIMIT_MESSAGE });
  }
  // Los validadores regresan null cuando el dato es válido: el primer mensaje
  // no-nulo de la cadena ?? es el error que se responde.
  const invalid =
    validatePersonName(name) ??
    validateEmail(email) ??
    validatePhone(phone) ??
    validatePassword(password);
  if (invalid) return res.status(400).json({ error: invalid });
  const normalized = email.trim().toLowerCase();
  if (!(await emailDomainAcceptsMail(normalized))) {
    return res.status(400).json({ error: 'El dominio de ese correo no existe o no recibe correos. Revisa que esté bien escrito.' });
  }
  const exists = db.prepare('SELECT 1 FROM users WHERE email = ?').get(normalized);
  if (exists) return res.status(409).json({ error: 'Ese correo ya tiene una cuenta' });

  record(registerBucket);
  const createdAt = new Date().toISOString();
  try {
    // La cuenta nace pendiente de verificar (verified = 0); el enlace del
    // correo es lo único que la pasa a verificada.
    db.prepare('INSERT INTO users (email, name, phone, password, created_at) VALUES (?, ?, ?, ?, ?)').run(
      normalized,
      name.trim(),
      String(phone).replace(/\D/g, ''),
      // Nunca se guarda la contraseña en claro (ver server/auth.js).
      hashPassword(password),
      createdAt,
    );
  } catch (error) {
    // Dos registros simultáneos con el mismo correo: el segundo pierde aquí
    // (email es PRIMARY KEY), no en el SELECT de arriba.
    if (isUniqueViolation(error)) {
      return res.status(409).json({ error: 'Ese correo ya tiene una cuenta' });
    }
    throw error;
  }

  const verification = await issueVerification(normalized, name.trim());
  res.status(201).json({ name: name.trim(), email: normalized, phone, verified: false, createdAt, ...verification });
});

// Paso 6 del flujo: el enlace del correo trae el token; aquí se valida y la
// cuenta pasa a verificada. La operación es IDEMPOTENTE mientras el token no
// venza: reabrir un enlace ya usado responde éxito de nuevo. Es a propósito —
// los clientes de correo y antivirus pre-abren enlaces (y el StrictMode de
// React duplica el efecto en dev); un token de un solo uso se "gastaría"
// antes de que el usuario real lo abra.
api.post('/usuarios/verificar', (req, res) => {
  const { token } = req.body ?? {};
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Falta el token de verificación' });
  }

  const row = db.prepare('SELECT * FROM users WHERE verify_token = ?').get(token);
  if (!row) {
    return res.status(400).json({ error: 'El enlace de verificación no es válido o ya se usó.' });
  }
  if (row.verified) {
    return res.json({ ok: true, name: row.name, email: row.email, alreadyVerified: true });
  }
  if (!row.verify_expires || row.verify_expires < new Date().toISOString()) {
    // Vencido (24 h): se avisa con el correo para que el cliente pida otro.
    return res.status(410).json({
      error: 'El enlace de verificación ya venció. Pide uno nuevo.',
      expired: true,
      email: row.email,
    });
  }

  // El token se conserva (no se borra) para que el mismo enlace siga cayendo
  // en el caso `row.verified` de arriba hasta que venza solo.
  db.prepare('UPDATE users SET verified = 1 WHERE email = ?').run(row.email);
  res.json({ ok: true, name: row.name, email: row.email });
});

// Reenvía el correo de verificación con un token nuevo (el anterior se invalida).
api.post('/usuarios/reenviar-verificacion', async (req, res) => {
  const { email } = req.body ?? {};
  const invalid = validateEmail(email);
  if (invalid) return res.status(400).json({ error: invalid });

  const normalized = email.trim().toLowerCase();
  // Mismos límites que la recuperación: cada reenvío es un correo real.
  if (isLimited(`reenviar:${normalized}`, 3, 15) || isLimited(`reenviar-ip:${clientIp(req)}`, 10, 60)) {
    return res.status(429).json({ error: 'Ya se reenvió el correo varias veces. Espera unos minutos y revisa tu bandeja.' });
  }
  record(`reenviar:${normalized}`);
  record(`reenviar-ip:${clientIp(req)}`);
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(normalized);
  if (!row) return res.status(404).json({ error: 'No encontramos una cuenta con ese correo' });
  if (row.verified) return res.json({ ok: true, alreadyVerified: true });

  const verification = await issueVerification(normalized, row.name);
  res.json({ ok: true, ...verification });
});

api.post('/usuarios/validar', (req, res) => {
  const { email, password } = req.body ?? {};
  const normalized = String(email ?? '').toLowerCase();
  // Solo cuentan los intentos FALLIDOS, y un login exitoso perdona el bucket
  // del correo: el dueño legítimo no queda castigado por sus propios typos,
  // pero la fuerza bruta (por cuenta o rotando cuentas desde una IP) se topa.
  const emailBucket = `login:${normalized}`;
  const ipBucket = `login-ip:${clientIp(req)}`;
  if (isLimited(emailBucket, 8, 15) || isLimited(ipBucket, 30, 15)) {
    return res.status(429).json({ error: LIMIT_MESSAGE });
  }
  const failed = () => {
    record(emailBucket);
    record(ipBucket);
  };
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(normalized);
  if (!row) {
    failed();
    return res.json({ ok: false, reason: 'email' });
  }
  if (!verifyPassword(password ?? '', row.password)) {
    failed();
    return res.json({ ok: false, reason: 'password' });
  }
  clear(emailBucket);
  // Cuenta de antes del hash: este es el único momento en que tenemos la
  // contraseña en claro y comprobada, así que se migra aquí mismo.
  if (!isHashed(row.password)) {
    db.prepare('UPDATE users SET password = ? WHERE email = ?').run(hashPassword(password), row.email);
  }
  // El token es lo que autoriza las peticiones siguientes; el rol que decide
  // permisos vive en la base, no en lo que el cliente guarde.
  const token = createSession(row.email);
  res.json({ ok: true, user: publicUser(row), token });
});

// Logout: invalida el token en el servidor (borrar el localStorage no basta,
// el token seguiría siendo válido si alguien lo copió).
api.delete('/sesion', requireAuth, (req, res) => {
  deleteSession(req.user.token);
  res.json({ ok: true });
});

api.put('/usuarios/:email', requireSelfOrAdmin, (req, res) => {
  const normalized = req.params.email.toLowerCase();
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(normalized);
  if (!row) return res.status(404).json({ error: 'Usuario no encontrado' });

  // Solo se validan los campos que sí vienen (los ausentes conservan su valor).
  const invalid =
    (req.body?.name !== undefined ? validatePersonName(req.body.name) : null) ??
    (req.body?.phone !== undefined ? validatePhone(req.body.phone) : null);
  if (invalid) return res.status(400).json({ error: invalid });

  const name = req.body?.name?.trim() || row.name;
  const phone = req.body?.phone ? String(req.body.phone).replace(/\D/g, '') : row.phone;
  db.prepare('UPDATE users SET name = ?, phone = ? WHERE email = ?').run(name, phone, normalized);
  res.json({ ...publicUser(row), name, phone });
});

api.put('/usuarios/:email/password', requireSelfOrAdmin, (req, res) => {
  const normalized = req.params.email.toLowerCase();
  const { password } = req.body ?? {};
  const invalid = validatePassword(password);
  if (invalid) return res.status(400).json({ error: invalid });
  const result = db.prepare('UPDATE users SET password = ? WHERE email = ?').run(hashPassword(password), normalized);
  if (result.changes === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
  // Al cambiar la contraseña se cierran las demás sesiones de la cuenta
  // (si alguien más la conocía, su sesión muere aquí); la actual sobrevive.
  db.prepare('DELETE FROM sessions WHERE email = ? AND token <> ?').run(normalized, req.user.token);
  res.json({ ok: true });
});

// ---------- Recuperación de contraseña (código de 6 dígitos por correo) ----------

const RESET_CODE_MINUTES = 30;
const RESET_MAX_ATTEMPTS = 5;

// Valida el código contra la cuenta; regresa null si es correcto o el error a
// responder. Cada intento fallido cuenta: 6 dígitos se fuerzan por ensayo y
// error si no hay límite de intentos.
function checkResetCode(row, code) {
  if (!row?.reset_code || !row.reset_expires) {
    return { status: 400, error: 'Pide primero un código de recuperación.' };
  }
  if (row.reset_expires < new Date().toISOString()) {
    return { status: 410, error: 'El código ya venció. Pide uno nuevo.' };
  }
  if (row.reset_attempts >= RESET_MAX_ATTEMPTS) {
    return { status: 410, error: 'Demasiados intentos fallidos. Pide un código nuevo.' };
  }
  if (String(code ?? '').trim() !== row.reset_code) {
    db.prepare('UPDATE users SET reset_attempts = reset_attempts + 1 WHERE email = ?').run(row.email);
    return { status: 400, error: 'El código no coincide. Revísalo e inténtalo de nuevo.' };
  }
  return null;
}

api.post('/usuarios/recuperar', async (req, res) => {
  const { email } = req.body ?? {};
  const invalid = validateEmail(email);
  if (invalid) return res.status(400).json({ error: invalid });
  const normalized = email.trim().toLowerCase();
  // Cada solicitud manda un correo: límites cortos por cuenta y por IP (esto
  // también frena a quien sondea qué correos tienen cuenta).
  if (isLimited(`recuperar:${normalized}`, 3, 15) || isLimited(`recuperar-ip:${clientIp(req)}`, 10, 60)) {
    return res.status(429).json({ error: 'Ya se pidieron varios códigos. Espera unos minutos y revisa tu correo.' });
  }
  record(`recuperar:${normalized}`);
  record(`recuperar-ip:${clientIp(req)}`);
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(normalized);
  if (!row) return res.status(404).json({ error: 'No encontramos una cuenta con ese correo' });

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expires = new Date(Date.now() + RESET_CODE_MINUTES * 60 * 1000).toISOString();
  db.prepare('UPDATE users SET reset_code = ?, reset_expires = ?, reset_attempts = 0 WHERE email = ?').run(code, expires, normalized);

  try {
    const { sent } = await sendPasswordResetEmail({ to: normalized, name: row.name, code });
    // Sin SMTP (dev), el código viaja al cliente para mostrarse en pantalla —
    // mismo patrón que devVerifyUrl en el registro.
    res.json({ ok: true, mailSent: sent, ...(sent ? {} : { devResetCode: code }) });
  } catch (error) {
    console.error('No se pudo enviar el correo de recuperación:', error);
    res.status(502).json({ error: 'No se pudo enviar el correo. Inténtalo de nuevo en un momento.' });
  }
});

// Paso intermedio del formulario: confirma el código antes de pedir la
// contraseña nueva (mejor que descubrir el error hasta el final).
api.post('/usuarios/recuperar/validar', (req, res) => {
  const { email, code } = req.body ?? {};
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email ?? '').toLowerCase());
  const failed = checkResetCode(row, code);
  if (failed) return res.status(failed.status).json({ error: failed.error });
  res.json({ ok: true });
});

api.post('/usuarios/restablecer', (req, res) => {
  const { email, code, password } = req.body ?? {};
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email ?? '').toLowerCase());
  const failed = checkResetCode(row, code);
  if (failed) return res.status(failed.status).json({ error: failed.error });
  const invalid = validatePassword(password);
  if (invalid) return res.status(400).json({ error: invalid });

  db.prepare(
    'UPDATE users SET password = ?, reset_code = NULL, reset_expires = NULL, reset_attempts = 0 WHERE email = ?',
  ).run(hashPassword(password), row.email);
  // Quien tuviera una sesión abierta con la contraseña vieja queda fuera.
  db.prepare('DELETE FROM sessions WHERE email = ?').run(row.email);
  res.json({ ok: true });
});

// ---------- Productos ----------

// Campos que varían por categoría; viajan planos en el JSON del cliente pero
// se guardan juntos en la columna `attributes` (ver server/db.js).
const PRODUCT_ATTRIBUTES = [
  'brand',
  'storage',
  'color',
  'warranty',
  'compatibleModels',
  'customCompatibleModel',
  'chargerInput',
  'screenProtectorType',
  'privacy',
];

function pickAttributes(body) {
  const attributes = {};
  for (const key of PRODUCT_ATTRIBUTES) {
    if (body[key] !== undefined) attributes[key] = body[key];
  }
  return attributes;
}

function publicProduct(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: row.price,
    stock: row.stock,
    status: row.status,
    description: row.description,
    image: row.image,
    images: JSON.parse(row.images ?? '[]'),
    featured: Boolean(row.featured),
    // Aplanados de vuelta: el frontend los usa como campos normales.
    ...JSON.parse(row.attributes ?? '{}'),
    createdAt: row.created_at,
  };
}

api.get('/productos', (req, res) => {
  // El destacado siempre va primero: el admin lo ve anclado arriba de su lista
  // y el inicio del sitio lo toma sin ordenar de nuevo.
  const rows = db.prepare('SELECT * FROM products ORDER BY featured DESC, created_at DESC').all();
  res.json(rows.map(publicProduct));
});

api.get('/productos/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Producto no encontrado' });
  res.json(publicProduct(row));
});

api.post('/productos', requireAdmin, (req, res) => {
  const { name, category, price, stock, status, description, image, images } = req.body ?? {};
  if (!category) return res.status(400).json({ error: 'Faltan datos del producto' });
  const invalid =
    validateProductName(name) ??
    validatePrice(price) ??
    validateStock(stock) ??
    validateDescription(description ?? '');
  if (invalid) return res.status(400).json({ error: invalid });

  const row = {
    id: `${slugify(name)}-${Date.now().toString(36)}`,
    name: name.trim(),
    category,
    price,
    stock,
    status: status ?? 'nuevo',
    description: description ?? '',
    image: image ?? null,
    images: JSON.stringify(images ?? []),
    attributes: JSON.stringify(pickAttributes(req.body)),
    created_at: new Date().toISOString(),
  };
  db.prepare(
    `INSERT INTO products (id, name, category, price, stock, status, description, image, images, attributes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(row.id, row.name, row.category, row.price, row.stock, row.status, row.description, row.image, row.images, row.attributes, row.created_at);
  res.status(201).json(publicProduct(row));
});

api.put('/productos/:id', requireAdmin, (req, res) => {
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Producto no encontrado' });

  const body = req.body ?? {};
  // Solo se validan los campos que sí vienen (los ausentes conservan su valor).
  const invalid =
    (body.name !== undefined ? validateProductName(body.name) : null) ??
    (body.price !== undefined ? validatePrice(body.price) : null) ??
    (body.stock !== undefined ? validateStock(body.stock) : null) ??
    (body.description !== undefined ? validateDescription(body.description) : null);
  if (invalid) return res.status(400).json({ error: invalid });
  const updated = {
    name: body.name?.trim() || row.name,
    category: body.category ?? row.category,
    price: typeof body.price === 'number' ? body.price : row.price,
    stock: typeof body.stock === 'number' ? body.stock : row.stock,
    status: body.status ?? row.status,
    description: body.description ?? row.description,
    // Si el form no manda foto nueva, se conserva la actual (editar sin re-subir).
    image: body.image !== undefined ? body.image : row.image,
    images: body.images !== undefined ? JSON.stringify(body.images) : row.images,
    // Los atributos se reemplazan completos (no merge): al cambiar de categoría
    // no deben quedar claves huérfanas de la categoría anterior.
    attributes: JSON.stringify(pickAttributes(body)),
  };
  db.prepare(
    `UPDATE products
       SET name = ?, category = ?, price = ?, stock = ?, status = ?, description = ?, image = ?, images = ?, attributes = ?
     WHERE id = ?`,
  ).run(updated.name, updated.category, updated.price, updated.stock, updated.status, updated.description, updated.image, updated.images, updated.attributes, req.params.id);
  res.json(publicProduct({ ...row, ...updated }));
});

// Marca (o desmarca) el producto destacado que aparece en el inicio del sitio.
// Solo puede haber uno: se limpian todos y se marca el nuevo en la misma
// operación, así destacar un producto quita el anterior sin paso extra.
api.put('/productos/:id/destacado', requireAdmin, (req, res) => {
  const { featured } = req.body ?? {};
  const row = db.prepare('SELECT 1 FROM products WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Producto no encontrado' });

  // Transacción: sin ella, dos peticiones simultáneas (o de distintos workers)
  // pueden intercalar los UPDATE y dejar dos productos destacados a la vez.
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec('UPDATE products SET featured = 0');
    if (featured) {
      db.prepare('UPDATE products SET featured = 1 WHERE id = ?').run(req.params.id);
    }
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
  res.json({ ok: true });
});

api.delete('/productos/:id', requireAdmin, (req, res) => {
  const result = db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Producto no encontrado' });
  res.json({ ok: true });
});

// ---------- Pedidos ----------

function publicOrder(row) {
  return { ...row, items: JSON.parse(row.items ?? '[]') };
}

api.get('/pedidos', requireAuth, (req, res) => {
  // El admin ve todos (o filtra por ?email=); un cliente solo los suyos —
  // el filtro sale de su sesión, no del query (no puede espiar otros correos).
  const email =
    req.user.role === 'admin'
      ? req.query.email
        ? String(req.query.email).toLowerCase()
        : null
      : req.user.email;
  const rows = email
    ? db.prepare('SELECT * FROM orders WHERE email = ? ORDER BY date DESC, id DESC').all(email)
    : db.prepare('SELECT * FROM orders ORDER BY date DESC, id DESC').all();
  res.json(rows.map(publicOrder));
});

api.post('/pedidos', requireAuth, (req, res) => {
  const { customer, phone, products, items, total } = req.body ?? {};
  if (!products || typeof total !== 'number') {
    return res.status(400).json({ error: 'Faltan datos del pedido' });
  }
  const invalid =
    validatePersonName(customer) ??
    validatePhone(phone) ??
    // El total lo recalcula el carrito, pero validar el rango evita basura
    // capturada directo contra el API.
    validatePrice(total, 'El total') ??
    (String(products).length > 2000 ? 'El resumen del pedido es demasiado largo.' : null) ??
    (Array.isArray(items) && items.length > 100 ? 'El pedido tiene demasiados renglones.' : null);
  if (invalid) return res.status(400).json({ error: invalid });

  // Solo cuentas con correo verificado pueden comprar: el pedido debe venir
  // de un correo real al que podamos avisarle cuando esté listo. `verified`
  // sale de la sesión (auth.js lo lee fresco de la base en cada petición).
  if (!req.user.verified) {
    return res.status(403).json({
      error: 'Tu cuenta aún no está verificada. Revisa tu correo y confirma tu cuenta para poder comprar.',
      unverified: true,
    });
  }

  // 10 pedidos por hora por cuenta: nadie compra más seguido que eso de
  // verdad, y evita que una cuenta llene la base (y aparte inventario) a lo loco.
  const orderBucket = `pedidos:${req.user.email}`;
  if (isLimited(orderBucket, 10, 60)) {
    return res.status(429).json({ error: LIMIT_MESSAGE });
  }

  const lines = Array.isArray(items) ? items : [];
  for (const line of lines) {
    if (!Number.isInteger(line?.qty) || line.qty < 1 || line.qty > 999) {
      return res.status(400).json({ error: 'Las cantidades del pedido no son válidas.' });
    }
  }

  const order = {
    id: generateFolio(),
    customer: customer.trim(),
    phone: String(phone ?? '').replace(/\D/g, ''),
    // El pedido queda a nombre de la sesión, no del correo que diga el body:
    // nadie puede levantar pedidos a nombre de otra cuenta.
    email: req.user.email,
    products,
    items: JSON.stringify(lines),
    total,
    status: 'pendiente',
    date: todayKey(),
  };

  // Piezas requeridas por producto (un mismo producto puede venir en varios
  // renglones). Solo descuentan stock los productos que existen en la base;
  // los del catálogo estático no llevan inventario.
  const needed = orderStockByProduct(lines);

  // Stock y pedido en la MISMA transacción: dos compradores del último
  // iPhone no pueden ganar ambos — BEGIN IMMEDIATE serializa las escrituras
  // y el que llega después ya ve el stock descontado.
  db.exec('BEGIN IMMEDIATE');
  try {
    const shortages = [];
    for (const [id, qty] of needed) {
      const row = db.prepare('SELECT name, stock FROM products WHERE id = ?').get(id);
      if (!row) continue;
      if (row.stock < qty) {
        shortages.push(row.stock === 0 ? `"${row.name}" se agotó` : `de "${row.name}" solo quedan ${row.stock}`);
      }
    }
    if (shortages.length > 0) {
      db.exec('ROLLBACK');
      return res.status(409).json({
        error: `No hay inventario suficiente: ${shortages.join('; ')}. Ajusta tu carrito e inténtalo de nuevo.`,
        outOfStock: true,
      });
    }
    for (const [id, qty] of needed) {
      db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(qty, id);
    }
    // El folio lleva un sufijo aleatorio corto (legible para dictar en
    // tienda), así que dos pedidos del mismo día pueden chocar: se reintenta
    // con un folio nuevo en vez de regresarle un 500 al cliente. El INSERT
    // fallido no aborta la transacción (SQLite invalida solo el statement).
    for (let attempt = 0; ; attempt += 1) {
      try {
        db.prepare(
          'INSERT INTO orders (id, customer, phone, email, products, items, total, status, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        ).run(order.id, order.customer, order.phone, order.email, order.products, order.items, order.total, order.status, order.date);
        break;
      } catch (error) {
        if (!isUniqueViolation(error) || attempt >= 4) throw error;
        order.id = generateFolio();
      }
    }
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
  // Solo los pedidos que sí se crearon consumen el límite.
  record(orderBucket);
  res.status(201).json(publicOrder(order));
});

// Suma las piezas por producto de los renglones de un pedido. Solo cuentan
// los renglones con id (los pedidos de antes del control de inventario no lo
// guardaban) y qty válida.
function orderStockByProduct(lines) {
  const needed = new Map();
  for (const line of lines) {
    if (line?.id && Number.isInteger(line.qty) && line.qty > 0) {
      needed.set(line.id, (needed.get(line.id) ?? 0) + line.qty);
    }
  }
  return needed;
}

api.put('/pedidos/:id/estado', requireAuth, (req, res) => {
  const { status } = req.body ?? {};
  if (!['pendiente', 'entregado-vendido', 'cancelado'].includes(status)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }
  const order = db.prepare('SELECT email, status, items FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });
  // El admin mueve cualquier estado; un cliente solo puede cancelar SU pedido
  // y solo mientras siga pendiente (uno entregado ya no se "des-vende").
  if (req.user.role !== 'admin') {
    const ownPendingCancel =
      order.email === req.user.email && order.status === 'pendiente' && status === 'cancelado';
    if (!ownPendingCancel) {
      return res.status(403).json({ error: 'No tienes permiso para cambiar este pedido.' });
    }
  }

  // Inventario según la transición: ENTRAR a 'cancelado' regresa las piezas
  // al stock; SALIR de 'cancelado' (el admin reactiva un pedido) las vuelve a
  // apartar, y se rechaza si ya no alcanzan. Entre pendiente y entregado no
  // hay movimiento: las piezas se apartaron al crear el pedido.
  const needed = orderStockByProduct(JSON.parse(order.items ?? '[]'));

  db.exec('BEGIN IMMEDIATE');
  try {
    // El estado se relee DENTRO de la transacción: dos cambios simultáneos
    // sobre el mismo pedido no deben mover el inventario dos veces.
    const current = db.prepare('SELECT status FROM orders WHERE id = ?').get(req.params.id).status;
    const entering = status === 'cancelado' && current !== 'cancelado';
    const leaving = current === 'cancelado' && status !== 'cancelado';

    if (leaving) {
      const shortages = [];
      for (const [id, qty] of needed) {
        const row = db.prepare('SELECT name, stock FROM products WHERE id = ?').get(id);
        if (row && row.stock < qty) shortages.push(`"${row.name}"`);
      }
      if (shortages.length > 0) {
        db.exec('ROLLBACK');
        return res.status(409).json({
          error: `No hay inventario para reactivar el pedido (${shortages.join(', ')} sin piezas suficientes).`,
        });
      }
      for (const [id, qty] of needed) {
        db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(qty, id);
      }
    }
    if (entering) {
      for (const [id, qty] of needed) {
        db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').run(qty, id);
      }
    }
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
  res.json({ ok: true });
});

// ---------- Citas ----------

function publicAppointment(row) {
  return {
    id: row.id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerEmail: row.customer_email,
    serviceName: row.service_name,
    servicePrice: row.service_price,
    device: row.device,
    date: row.date,
    time: row.time,
    description: row.description,
  };
}

api.get('/citas', (req, res) => {
  const { date } = req.query;
  // Consulta pública por fecha: la página de Servicios solo necesita QUÉ
  // horarios están ocupados para pintar el calendario — nunca los datos de
  // los clientes (antes esta ruta regresaba nombre/teléfono/correo de todos).
  if (date) {
    const rows = db.prepare('SELECT time FROM appointments WHERE date = ? ORDER BY time').all(String(date));
    return res.json(rows.map((row) => ({ time: row.time })));
  }

  const user = getSessionUser(req);
  if (!user) return res.status(401).json({ error: 'Inicia sesión para continuar.' });
  if (user.role === 'admin') {
    const rows = db.prepare('SELECT * FROM appointments ORDER BY date, time').all();
    return res.json(rows.map(publicAppointment));
  }
  // Un cliente ve solo sus citas: por el correo de su cuenta o su teléfono
  // registrado (las citas agendadas sin sesión se ligan por teléfono).
  const rows = db
    .prepare('SELECT * FROM appointments WHERE customer_email = ? OR customer_phone = ? ORDER BY date, time')
    .all(user.email, user.phone || '—');
  res.json(rows.map(publicAppointment));
});

api.post('/citas', (req, res) => {
  const { customerName, customerPhone, customerEmail, serviceName, servicePrice, device, date, time, description } =
    req.body ?? {};
  if (!serviceName || !date || !time) {
    return res.status(400).json({ error: 'Faltan datos de la cita' });
  }
  // Sin límite, una sola conexión podría llenar el calendario completo y
  // dejar sin horarios a los clientes reales.
  const appointmentBucket = `citas:${clientIp(req)}`;
  if (isLimited(appointmentBucket, 5, 24 * 60)) {
    return res.status(429).json({
      error: 'Ya se agendaron varias citas desde esta conexión hoy. Llámanos para agendar otra.',
    });
  }

  const invalid =
    validatePersonName(customerName) ??
    validatePhone(customerPhone) ??
    // El correo de la cita es opcional (liga la cita a la cuenta si hay sesión).
    (customerEmail ? validateEmail(customerEmail) : null) ??
    (device ? validateDevice(device) : null) ??
    validateDescription(description ?? '') ??
    (!/^\d{4}-\d{2}-\d{2}$/.test(String(date)) ? 'La fecha de la cita no es válida.' : null) ??
    (!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(time)) ? 'El horario de la cita no es válido.' : null) ??
    (String(serviceName).length > LIMITS.productName.max ? 'El nombre del servicio es demasiado largo.' : null);
  if (invalid) return res.status(400).json({ error: invalid });

  // El horario se valida también aquí: dos clientes podrían elegir el mismo
  // slot al mismo tiempo y solo el primero debe ganarlo.
  const taken = db.prepare('SELECT 1 FROM appointments WHERE date = ? AND time = ?').get(date, time);
  if (taken) return res.status(409).json({ error: 'Ese horario acaba de ocuparse' });

  const appointment = {
    id: `apt-${Date.now().toString(36)}`,
    customer_name: customerName.trim(),
    customer_phone: String(customerPhone).replace(/\D/g, ''),
    customer_email: String(customerEmail ?? '').toLowerCase(),
    service_name: serviceName,
    service_price: servicePrice ?? 0,
    device: device ?? '',
    date,
    time,
    description: description ?? '',
  };
  try {
    db.prepare(
      `INSERT INTO appointments
         (id, customer_name, customer_phone, customer_email, service_name, service_price, device, date, time, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      appointment.id,
      appointment.customer_name,
      appointment.customer_phone,
      appointment.customer_email,
      appointment.service_name,
      appointment.service_price,
      appointment.device,
      appointment.date,
      appointment.time,
      appointment.description,
    );
  } catch (error) {
    // Dos clientes eligiendo el mismo slot al mismo tiempo: el índice UNIQUE
    // (date, time) deja pasar solo al primero; el SELECT de arriba no alcanza.
    if (isUniqueViolation(error)) {
      return res.status(409).json({ error: 'Ese horario acaba de ocuparse' });
    }
    throw error;
  }
  // Solo las citas que sí se crearon consumen el límite (un 409 por horario
  // ocupado no debe castigar al cliente que reintenta con otro horario).
  record(appointmentBucket);
  res.status(201).json(publicAppointment(appointment));
});

// ---------- Servicios ----------

function publicService(row) {
  return { id: row.id, name: row.name, price: row.price, description: row.description };
}

// Público: la página de Servicios muestra el catálogo y arma el modal de cita.
api.get('/servicios', (req, res) => {
  const rows = db.prepare('SELECT * FROM services ORDER BY created_at').all();
  res.json(rows.map(publicService));
});

// Validación compartida con los productos: nombre (3–80), precio (>0,
// ≤1,000,000) y descripción opcional. El frontend pinta el mismo mensaje.
function invalidService(body, { partial = false } = {}) {
  return (
    (partial && body.name === undefined ? null : validateProductName(body.name)) ??
    (partial && body.price === undefined ? null : validatePrice(body.price, 'El costo')) ??
    (body.description !== undefined ? validateDescription(body.description, LIMITS.serviceDescription.max) : null)
  );
}

api.post('/servicios', requireAdmin, (req, res) => {
  const body = req.body ?? {};
  const invalid = invalidService(body);
  if (invalid) return res.status(400).json({ error: invalid });

  const row = {
    id: `${slugify(body.name)}-${Date.now().toString(36)}`,
    name: body.name.trim(),
    price: Number(body.price),
    description: body.description?.trim() ?? '',
    created_at: new Date().toISOString(),
  };
  db.prepare('INSERT INTO services (id, name, price, description, created_at) VALUES (?, ?, ?, ?, ?)').run(
    row.id, row.name, row.price, row.description, row.created_at,
  );
  res.status(201).json(publicService(row));
});

api.put('/servicios/:id', requireAdmin, (req, res) => {
  const row = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Servicio no encontrado' });

  const body = req.body ?? {};
  const invalid = invalidService(body, { partial: true });
  if (invalid) return res.status(400).json({ error: invalid });

  const updated = {
    name: body.name?.trim() || row.name,
    price: body.price !== undefined ? Number(body.price) : row.price,
    description: body.description !== undefined ? body.description.trim() : row.description,
  };
  db.prepare('UPDATE services SET name = ?, price = ?, description = ? WHERE id = ?').run(
    updated.name, updated.price, updated.description, req.params.id,
  );
  res.json(publicService({ ...row, ...updated }));
});

api.delete('/servicios/:id', requireAdmin, (req, res) => {
  const result = db.prepare('DELETE FROM services WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Servicio no encontrado' });
  res.json({ ok: true });
});

// El mismo router en ambos prefijos: /api en dev (proxy de Vite) y
// /AUTOCELLS/api cuando la app se sirve bajo el subpath de producción.
app.use('/api', api);
app.use('/AUTOCELLS/api', api);
// El Nginx del VPS (autocells.store) reescribe /api/(.*) → /$1 antes del
// proxy_pass, así que las peticiones llegan aquí SIN el prefijo /api.
// Va al final: /api y /AUTOCELLS/api ganan cuando el prefijo sí viene.
app.use('/', api);

// Cualquier error no manejado regresa JSON (el default de Express es una
// página HTML que rompe a los clientes fetch) y no tira el proceso — con
// varios usuarios, una petición fallida no debe afectar a las demás.
// eslint-disable-next-line no-unused-vars -- Express identifica el error handler por su aridad de 4.
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`API de AUTOCELLS escuchando en http://localhost:${PORT} (pid ${process.pid})`);
});
