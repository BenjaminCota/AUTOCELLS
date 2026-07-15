// Autenticación del API: hash de contraseñas y sesiones con token.
//
// - Hash con scrypt de node:crypto (mismo criterio que node:sqlite: nada de
//   dependencias nativas que compilar). Formato "scrypt$salt$hash" en hex; las
//   contraseñas legadas en texto plano se detectan por la ausencia del prefijo
//   y se re-hashean solas en el siguiente login exitoso (migración al vuelo,
//   porque no podemos recuperar el texto plano de vuelta... al revés: no
//   podemos hashear lo que no sabemos hasta que el usuario lo teclee).
// - Sesiones en la tabla `sessions` de SQLite (compartida entre workers del
//   cluster, igual que el resto de la base): el login genera un token
//   aleatorio que el frontend manda en `Authorization: Bearer`. El rol NUNCA
//   viaja en el token ni se confía del cliente: se lee de `users` en cada
//   petición, así el localStorage manipulado no da permisos y revocar un
//   admin surte efecto al instante.

import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { db } from './db.js';

const SESSION_DAYS = 30;

export function isHashed(stored) {
  return typeof stored === 'string' && stored.startsWith('scrypt$');
}

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  return `scrypt$${salt}$${scryptSync(String(password), salt, 64).toString('hex')}`;
}

export function verifyPassword(password, stored) {
  // Cuenta legada aún en texto plano: comparación directa (se re-hashea en el
  // login, ver /usuarios/validar).
  if (!isHashed(stored)) return stored === String(password);
  const [, salt, hex] = stored.split('$');
  const expected = Buffer.from(hex, 'hex');
  const actual = scryptSync(String(password), salt, expected.length);
  // timingSafeEqual: comparar con === filtraría por tiempo cuántos bytes
  // coinciden.
  return timingSafeEqual(actual, expected);
}

export function createSession(email) {
  const token = randomBytes(32).toString('hex');
  const now = new Date();
  // Limpieza oportunista: no hay cron, así que las sesiones vencidas se
  // barren cada vez que alguien inicia sesión.
  db.prepare('DELETE FROM sessions WHERE expires < ?').run(now.toISOString());
  db.prepare('INSERT INTO sessions (token, email, expires, created_at) VALUES (?, ?, ?, ?)').run(
    token,
    email,
    new Date(now.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString(),
    now.toISOString(),
  );
  return token;
}

export function deleteSession(token) {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

function tokenFromRequest(req) {
  const header = req.headers.authorization ?? '';
  return header.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
}

// Usuario de la sesión, o null si no hay token válido. `users` se consulta
// fresco en cada petición: rol y verified actuales, no los del día del login.
export function getSessionUser(req) {
  const token = tokenFromRequest(req);
  if (!token) return null;
  const session = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token);
  if (!session || session.expires < new Date().toISOString()) return null;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(session.email);
  if (!user) return null;
  return {
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role ?? 'user',
    verified: Boolean(user.verified),
    token,
  };
}

export function requireAuth(req, res, next) {
  const user = getSessionUser(req);
  if (!user) return res.status(401).json({ error: 'Inicia sesión para continuar.' });
  req.user = user;
  next();
}

export function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Solo el administrador puede hacer esto.' });
    }
    next();
  });
}

// Para rutas /usuarios/:email — solo el dueño de la cuenta, o el admin.
export function requireSelfOrAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin' && req.user.email !== req.params.email.toLowerCase()) {
      return res.status(403).json({ error: 'No tienes permiso sobre esa cuenta.' });
    }
    next();
  });
}
