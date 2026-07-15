// Límite de intentos (rate limiting) respaldado en SQLite.
//
// Los contadores viven en la tabla `rate_events` y no en memoria por la misma
// razón que las sesiones: con el modo cluster hay varios procesos, y un
// contador en memoria dejaría pasar N veces el límite (uno por worker).
// El volumen es mínimo (solo endpoints sensibles) y los eventos viejos se
// barren solos en cada escritura.
//
// Uso típico en un endpoint:
//   if (isLimited(`login:${email}`, 8, 15)) return res.status(429)...
//   record(`login:${email}`);          // cuenta el intento
//   clear(`login:${email}`);           // lo perdona (ej. login exitoso)
import { db } from './db.js';

// Todo evento caduca a las 24 h aunque su ventana fuera menor: mantiene la
// tabla microscópica sin necesidad de un cron.
const SWEEP_HOURS = 24;

export function isLimited(bucket, max, windowMinutes) {
  const cutoff = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
  const { n } = db
    .prepare('SELECT COUNT(*) AS n FROM rate_events WHERE bucket = ? AND at >= ?')
    .get(bucket, cutoff);
  return n >= max;
}

export function record(bucket) {
  db.prepare('DELETE FROM rate_events WHERE at < ?').run(
    new Date(Date.now() - SWEEP_HOURS * 60 * 60 * 1000).toISOString(),
  );
  db.prepare('INSERT INTO rate_events (bucket, at) VALUES (?, ?)').run(bucket, new Date().toISOString());
}

export function clear(bucket) {
  db.prepare('DELETE FROM rate_events WHERE bucket = ?').run(bucket);
}

// IP real del cliente: Nginx la manda en X-Real-IP (el socket siempre trae
// 127.0.0.1 detrás del proxy). Si alguien le pega directo al puerto del
// backend puede falsear el header, pero eso solo le da MÁS límite a él, no
// menos a los demás (los buckets son por IP).
export function clientIp(req) {
  return String(req.headers['x-real-ip'] ?? req.socket.remoteAddress ?? 'desconocida');
}

// Mensaje estándar para el 429 (el frontend lo pinta tal cual).
export const LIMIT_MESSAGE = 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.';
