// API REST de AUTOCELLS (Express + SQLite vía node:sqlite).
// En dev, Vite hace proxy de /api hacia este servidor (ver vite.config.js);
// el frontend siempre llama con apiUrl() de src/lib/api.js.
import express from 'express';
import { db, generateFolio, todayKey } from './db.js';
import { slugify } from '../src/lib/slugify.js';

const PORT = process.env.PORT ?? 3001;
const app = express();
// Límite alto: las fotos de producto viajan como data URLs dentro del JSON
// (el default de 100kb rechazaría cualquier imagen real con un 413).
app.use(express.json({ limit: '25mb' }));

const api = express.Router();

// ---------- Usuarios ----------

function publicUser(row) {
  // Nunca regresar el password al cliente.
  return { name: row.name, email: row.email, phone: row.phone, createdAt: row.created_at };
}

api.get('/usuarios/:email', (req, res) => {
  const row = db
    .prepare('SELECT * FROM users WHERE email = ?')
    .get(req.params.email.toLowerCase());
  if (!row) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(publicUser(row));
});

api.post('/usuarios', (req, res) => {
  const { name, email, phone, password } = req.body ?? {};
  if (!name?.trim() || !email?.trim() || !phone || !password) {
    return res.status(400).json({ error: 'Faltan datos del registro' });
  }
  const normalized = email.trim().toLowerCase();
  const exists = db.prepare('SELECT 1 FROM users WHERE email = ?').get(normalized);
  if (exists) return res.status(409).json({ error: 'Ese correo ya tiene una cuenta' });

  const createdAt = new Date().toISOString();
  db.prepare('INSERT INTO users (email, name, phone, password, created_at) VALUES (?, ?, ?, ?, ?)').run(
    normalized,
    name.trim(),
    String(phone).replace(/\D/g, ''),
    password,
    createdAt,
  );
  res.status(201).json({ name: name.trim(), email: normalized, phone, createdAt });
});

api.post('/usuarios/validar', (req, res) => {
  const { email, password } = req.body ?? {};
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get((email ?? '').toLowerCase());
  if (!row) return res.json({ ok: false, reason: 'email' });
  if (row.password !== password) return res.json({ ok: false, reason: 'password' });
  res.json({ ok: true, user: publicUser(row) });
});

api.put('/usuarios/:email', (req, res) => {
  const normalized = req.params.email.toLowerCase();
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(normalized);
  if (!row) return res.status(404).json({ error: 'Usuario no encontrado' });

  const name = req.body?.name?.trim() || row.name;
  const phone = req.body?.phone ? String(req.body.phone).replace(/\D/g, '') : row.phone;
  db.prepare('UPDATE users SET name = ?, phone = ? WHERE email = ?').run(name, phone, normalized);
  res.json({ ...publicUser(row), name, phone });
});

api.put('/usuarios/:email/password', (req, res) => {
  const normalized = req.params.email.toLowerCase();
  const { password } = req.body ?? {};
  if (!password) return res.status(400).json({ error: 'Falta la contraseña nueva' });
  const result = db.prepare('UPDATE users SET password = ? WHERE email = ?').run(password, normalized);
  if (result.changes === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({ ok: true });
});

// ---------- Productos ----------

// Campos que varían por categoría; viajan planos en el JSON del cliente pero
// se guardan juntos en la columna `attributes` (ver server/db.js).
const PRODUCT_ATTRIBUTES = [
  'brand',
  'storage',
  'color',
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

api.post('/productos', (req, res) => {
  const { name, category, price, stock, status, description, image, images } = req.body ?? {};
  if (!name?.trim() || !category || typeof price !== 'number' || typeof stock !== 'number') {
    return res.status(400).json({ error: 'Faltan datos del producto' });
  }

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

api.put('/productos/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Producto no encontrado' });

  const body = req.body ?? {};
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
api.put('/productos/:id/destacado', (req, res) => {
  const { featured } = req.body ?? {};
  const row = db.prepare('SELECT 1 FROM products WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Producto no encontrado' });

  db.exec('UPDATE products SET featured = 0');
  if (featured) {
    db.prepare('UPDATE products SET featured = 1 WHERE id = ?').run(req.params.id);
  }
  res.json({ ok: true });
});

api.delete('/productos/:id', (req, res) => {
  const result = db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Producto no encontrado' });
  res.json({ ok: true });
});

// ---------- Pedidos ----------

function publicOrder(row) {
  return { ...row, items: JSON.parse(row.items ?? '[]') };
}

api.get('/pedidos', (req, res) => {
  const { email } = req.query;
  const rows = email
    ? db.prepare('SELECT * FROM orders WHERE email = ? ORDER BY date DESC, id DESC').all(String(email).toLowerCase())
    : db.prepare('SELECT * FROM orders ORDER BY date DESC, id DESC').all();
  res.json(rows.map(publicOrder));
});

api.post('/pedidos', (req, res) => {
  const { customer, phone, email, products, items, total } = req.body ?? {};
  if (!customer?.trim() || !products || typeof total !== 'number') {
    return res.status(400).json({ error: 'Faltan datos del pedido' });
  }

  const order = {
    id: generateFolio(),
    customer: customer.trim(),
    phone: String(phone ?? '').replace(/\D/g, ''),
    email: String(email ?? '').toLowerCase(),
    products,
    items: JSON.stringify(items ?? []),
    total,
    status: 'pendiente',
    date: todayKey(),
  };
  db.prepare(
    'INSERT INTO orders (id, customer, phone, email, products, items, total, status, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
  ).run(order.id, order.customer, order.phone, order.email, order.products, order.items, order.total, order.status, order.date);
  res.status(201).json(publicOrder(order));
});

api.put('/pedidos/:id/estado', (req, res) => {
  const { status } = req.body ?? {};
  if (!['pendiente', 'entregado-vendido', 'cancelado'].includes(status)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }
  const result = db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Pedido no encontrado' });
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
  const { date, email, phone } = req.query;
  let rows;
  if (date) {
    rows = db.prepare('SELECT * FROM appointments WHERE date = ?').all(String(date));
  } else if (email || phone) {
    rows = db
      .prepare('SELECT * FROM appointments WHERE customer_email = ? OR customer_phone = ? ORDER BY date, time')
      .all(String(email ?? '').toLowerCase(), String(phone ?? ''));
  } else {
    rows = db.prepare('SELECT * FROM appointments ORDER BY date, time').all();
  }
  res.json(rows.map(publicAppointment));
});

api.post('/citas', (req, res) => {
  const { customerName, customerPhone, customerEmail, serviceName, servicePrice, device, date, time, description } =
    req.body ?? {};
  if (!customerName?.trim() || !customerPhone || !serviceName || !date || !time) {
    return res.status(400).json({ error: 'Faltan datos de la cita' });
  }

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
  res.status(201).json(publicAppointment(appointment));
});

// El mismo router en ambos prefijos: /api en dev (proxy de Vite) y
// /AUTOCELLS/api cuando la app se sirve bajo el subpath de producción.
app.use('/api', api);
app.use('/AUTOCELLS/api', api);

app.listen(PORT, () => {
  console.log(`API de AUTOCELLS escuchando en http://localhost:${PORT}`);
});
