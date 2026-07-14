// Cliente del API de usuarios (server/index.js + SQLite). Antes las cuentas
// vivían en localStorage; ahora persisten en la base de datos y todas las
// funciones son async. La sesión activa sigue en localStorage (routes/auth.js).
import { apiUrl } from '../lib/api';

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PHONE_PATTERN = /^\d{10}$/;

async function request(path, options) {
  const response = await fetch(apiUrl(path), {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  return response;
}

export async function findUserByEmail(email) {
  const response = await request(`usuarios/${encodeURIComponent(email.trim().toLowerCase())}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Error al consultar el usuario');
  return response.json();
}

export async function registerUser({ name, email, phone, password }) {
  const response = await request('usuarios', {
    method: 'POST',
    body: JSON.stringify({ name, email, phone, password }),
  });
  if (!response.ok) throw new Error('No se pudo crear la cuenta');
  return response.json();
}

export async function validateCredentials(email, password) {
  const response = await request('usuarios/validar', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw new Error('Error al validar credenciales');
  return response.json();
}

export async function updateUser(email, data) {
  const response = await request(`usuarios/${encodeURIComponent(email)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('No se pudo actualizar el perfil');
  return response.json();
}

export async function updatePassword(email, newPassword) {
  const response = await request(`usuarios/${encodeURIComponent(email)}/password`, {
    method: 'PUT',
    body: JSON.stringify({ password: newPassword }),
  });
  if (!response.ok) throw new Error('No se pudo actualizar la contraseña');
  return true;
}

// Simula el código que llegaría por correo: se genera aquí y se muestra en
// pantalla. Con envío real de correos, este código se mandaría por email y
// nunca viviría en el cliente.
export function generateVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}
