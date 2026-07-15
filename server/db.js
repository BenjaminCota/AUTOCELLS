// Base de datos SQLite con el módulo integrado de Node (node:sqlite, Node 22+):
// sin dependencias nativas que compilar. El archivo autocells.db vive junto a
// este módulo y está ignorado en git (cada entorno genera el suyo).
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dbPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'autocells.db');
export const db = new DatabaseSync(dbPath);

// Concurrencia: WAL permite lecturas mientras alguien escribe (el journal por
// default bloquea la base completa en cada escritura) y es lo que hace seguro
// correr varios procesos sobre el mismo archivo (ver server/cluster.js).
// busy_timeout reintenta hasta 5s en vez de tronar con SQLITE_BUSY si dos
// escrituras coinciden. synchronous NORMAL es el nivel recomendado con WAL:
// commits más rápidos sin riesgo de corrupción.
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA busy_timeout = 5000;
  PRAGMA synchronous = NORMAL;
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    email      TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    phone      TEXT NOT NULL,
    -- Hash scrypt ("scrypt$salt$hash", ver server/auth.js). Las cuentas de
    -- antes del hash guardaban texto plano: se migran solas al iniciar sesión.
    password   TEXT NOT NULL,
    -- 'user' | 'admin'. El admin se crea con server/create-admin.js; el rol
    -- lo decide siempre esta columna, nunca el cliente.
    role       TEXT NOT NULL DEFAULT 'user',
    -- Verificación de correo: la cuenta nace pendiente (0) y solo el enlace
    -- del correo la pasa a verificada (1). Sin verificar no se puede comprar.
    verified       INTEGER NOT NULL DEFAULT 0,
    verify_token   TEXT,
    verify_expires TEXT,
    -- Recuperación de contraseña: código de 6 dígitos enviado por correo,
    -- con vigencia corta y contador de intentos (ver /usuarios/recuperar).
    reset_code     TEXT,
    reset_expires  TEXT,
    reset_attempts INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  -- Sesiones del API (Authorization: Bearer <token>). En SQLite y no en
  -- memoria para que los workers del cluster compartan las sesiones y un
  -- redeploy no cierre la sesión de nadie.
  CREATE TABLE IF NOT EXISTS sessions (
    token      TEXT PRIMARY KEY,
    email      TEXT NOT NULL,
    expires    TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  -- Contadores del rate limiting (server/rateLimit.js). En SQLite por lo
  -- mismo que las sesiones: los workers del cluster deben compartir el
  -- conteo. Los eventos caducan solos (barrido en cada escritura).
  CREATE TABLE IF NOT EXISTS rate_events (
    bucket TEXT NOT NULL,
    at     TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS orders (
    id       TEXT PRIMARY KEY, -- folio AC-AAMMDD-XXXX (o PED-xxxx en los demo)
    customer TEXT NOT NULL,
    phone    TEXT NOT NULL DEFAULT '',
    email    TEXT NOT NULL DEFAULT '',
    products TEXT NOT NULL,
    items    TEXT NOT NULL DEFAULT '[]', -- detalle JSON por renglón
    total    REAL NOT NULL,
    status   TEXT NOT NULL DEFAULT 'pendiente',
    date     TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id             TEXT PRIMARY KEY,
    customer_name  TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT NOT NULL DEFAULT '',
    service_name   TEXT NOT NULL,
    service_price  REAL NOT NULL,
    device         TEXT NOT NULL DEFAULT '',
    date           TEXT NOT NULL,
    time           TEXT NOT NULL,
    description    TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS products (
    id          TEXT PRIMARY KEY, -- slug del nombre + sufijo de tiempo (lo genera el server)
    name        TEXT NOT NULL,
    category    TEXT NOT NULL,
    price       REAL NOT NULL,
    stock       INTEGER NOT NULL DEFAULT 0,
    status      TEXT NOT NULL DEFAULT 'nuevo',
    description TEXT NOT NULL DEFAULT '',
    image       TEXT,                       -- portada: data URL subido desde el admin
    images      TEXT NOT NULL DEFAULT '[]', -- galería completa (JSON)
    -- Campos que cambian por categoría (brand, storage, compatibleModels, ...):
    -- JSON en una sola columna para no migrar el esquema con cada categoría nueva.
    attributes  TEXT NOT NULL DEFAULT '{}',
    -- 1 = anclado como destacado en el inicio del sitio (solo uno a la vez;
    -- lo garantiza el endpoint /productos/:id/destacado, no el esquema).
    featured    INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL
  );
`);

// Migración ligera: `featured` se agregó después del esquema original y las
// bases existentes no se regeneran (no hay seeds). En bases nuevas la columna
// ya viene del CREATE TABLE y el ALTER falla con "duplicate column" — ignorable.
try {
  db.exec('ALTER TABLE products ADD COLUMN featured INTEGER NOT NULL DEFAULT 0');
} catch {
  // La columna ya existe.
}

// Verificación de correo (mismas migraciones ligeras que `featured`). Las
// cuentas que existieran antes de esta migración quedan verified = 0: tendrán
// que verificarse con "reenviar correo" para poder comprar.
for (const alter of [
  'ALTER TABLE users ADD COLUMN verified INTEGER NOT NULL DEFAULT 0',
  'ALTER TABLE users ADD COLUMN verify_token TEXT',
  'ALTER TABLE users ADD COLUMN verify_expires TEXT',
  "ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'",
  'ALTER TABLE users ADD COLUMN reset_code TEXT',
  'ALTER TABLE users ADD COLUMN reset_expires TEXT',
  'ALTER TABLE users ADD COLUMN reset_attempts INTEGER NOT NULL DEFAULT 0',
]) {
  try {
    db.exec(alter);
  } catch {
    // La columna ya existe.
  }
}

db.exec('CREATE INDEX IF NOT EXISTS idx_users_verify_token ON users (verify_token)');
// Cerrar las sesiones de una cuenta (cambio de contraseña) busca por email.
db.exec('CREATE INDEX IF NOT EXISTS idx_sessions_email ON sessions (email)');
// El rate limiting cuenta eventos por bucket dentro de una ventana de tiempo.
db.exec('CREATE INDEX IF NOT EXISTS idx_rate_events ON rate_events (bucket, at)');

// Índices para las consultas reales del API (mis pedidos por correo, citas por
// día/cliente, catálogo ordenado): con pocos registros no se nota, pero evitan
// full scans cuando la base crece.
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_orders_email ON orders (email);
  CREATE INDEX IF NOT EXISTS idx_orders_date ON orders (date DESC);
  CREATE INDEX IF NOT EXISTS idx_appointments_email ON appointments (customer_email);
  CREATE INDEX IF NOT EXISTS idx_appointments_phone ON appointments (customer_phone);
  CREATE INDEX IF NOT EXISTS idx_products_order ON products (featured DESC, created_at DESC);
`);

// La unicidad del horario de citas la garantiza la base, no el "SELECT antes
// de INSERT" del endpoint (dos peticiones simultáneas pasan ambas ese check —
// sobre todo con varios workers). En try/catch por si una base vieja ya
// tuviera un slot duplicado: el índice no se puede crear pero la app funciona.
try {
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_slot ON appointments (date, time)');
} catch {
  // Datos legados con duplicados: se queda solo la validación del endpoint.
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Folio legible para dictar en tienda: prefijo de marca + fecha + sufijo
// aleatorio sin caracteres ambiguos (sin O/0, I/1/L).
const FOLIO_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateFolio() {
  const date = formatDateKey(new Date()).slice(2).replaceAll('-', '');
  const suffix = Array.from(
    { length: 4 },
    () => FOLIO_ALPHABET[Math.floor(Math.random() * FOLIO_ALPHABET.length)],
  ).join('');
  return `AC-${date}-${suffix}`;
}

export function todayKey() {
  return formatDateKey(new Date());
}

// Sin seeds: la base arranca vacía a propósito (los datos demo estorbaban para
// probar con datos reales). Si un entorno nuevo necesita datos, se capturan
// desde la propia app.
