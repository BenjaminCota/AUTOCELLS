// Crea (o actualiza) la cuenta del administrador del panel. Sin seeds: se
// corre a mano una vez por entorno, y puede re-ejecutarse para cambiar la
// contraseña. La cuenta nace verificada (no necesita el correo de
// confirmación) y con role 'admin', que es lo que el API revisa en cada
// petición protegida (ver server/auth.js).
//
//   node server/create-admin.js <correo> <contraseña> [nombre...]
//
// Reemplaza al viejo "admin demo" que viajaba hardcodeado en el frontend:
// las credenciales ya no existen en ningún archivo del repo.
import { db } from './db.js';
import { hashPassword } from './auth.js';
import { validateEmail, validatePassword } from '../src/lib/validation.js';

const [email, password, ...nameParts] = process.argv.slice(2);

if (!email || !password) {
  console.error('Uso: node server/create-admin.js <correo> <contraseña> [nombre]');
  process.exit(1);
}

const invalid = validateEmail(email) ?? validatePassword(password);
if (invalid) {
  console.error(invalid);
  process.exit(1);
}

const normalized = email.trim().toLowerCase();
const name = nameParts.join(' ').trim() || 'Administrador AUTOCELLS';

db.prepare(
  `INSERT INTO users (email, name, phone, password, role, verified, created_at)
   VALUES (?, ?, '', ?, 'admin', 1, ?)
   ON CONFLICT(email) DO UPDATE SET password = excluded.password, role = 'admin', verified = 1`,
).run(normalized, name, hashPassword(password), new Date().toISOString());

// Sesiones viejas de esta cuenta fuera: la contraseña acaba de cambiar.
db.prepare('DELETE FROM sessions WHERE email = ?').run(normalized);

console.log(`Cuenta de administrador lista: ${normalized} (${name})`);
