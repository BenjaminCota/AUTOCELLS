// Base de datos SQLite con el módulo integrado de Node (node:sqlite, Node 22+):
// sin dependencias nativas que compilar. El archivo autocells.db vive junto a
// este módulo y está ignorado en git (cada entorno genera el suyo).
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dbPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'autocells.db');
export const db = new DatabaseSync(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    email      TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    phone      TEXT NOT NULL,
    -- Texto plano solo como demo escolar: el backend definitivo debe guardar un hash.
    password   TEXT NOT NULL,
    created_at TEXT NOT NULL
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
