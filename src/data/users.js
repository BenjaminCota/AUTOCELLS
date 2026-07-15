// Cliente del API de usuarios (server/index.js + SQLite). Antes las cuentas
// vivían en localStorage; ahora persisten en la base de datos y todas las
// funciones son async. La sesión activa sigue en localStorage (routes/auth.js).
import { apiUrl } from '../lib/api';
import { authHeaders } from '../routes/auth';
// Los patterns de correo/teléfono viven ahora en lib/validation.js junto con
// el resto de las reglas compartidas con el server.

async function request(path, options = {}) {
  const response = await fetch(apiUrl(path), {
    ...options,
    // El token de sesión va en todas: los endpoints públicos lo ignoran y los
    // protegidos (perfil, contraseña) lo exigen.
    headers: { 'Content-Type': 'application/json', ...authHeaders(), ...options.headers },
  });
  return response;
}

export async function findUserByEmail(email) {
  const response = await request(`usuarios/${encodeURIComponent(email.trim().toLowerCase())}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Error al consultar el usuario');
  return response.json();
}

// Adjunta status y el mensaje del servidor al Error: el registro distingue
// el 409 (correo duplicado) del resto para pintarlo en su campo.
export async function registerUser({ name, email, phone, password }) {
  const response = await request('usuarios', {
    method: 'POST',
    body: JSON.stringify({ name, email, phone, password }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const error = new Error(data.error ?? 'No se pudo crear la cuenta');
    error.status = response.status;
    throw error;
  }
  return response.json();
}

// Valida el token del enlace del correo. Regresa el JSON del servidor; en
// error adjunta status y `expired` para que la página ofrezca el reenvío.
export async function verifyEmail(token) {
  const response = await request('usuarios/verificar', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error ?? 'No se pudo verificar el correo');
    error.status = response.status;
    error.expired = Boolean(data.expired);
    error.email = data.email;
    throw error;
  }
  return data;
}

export async function resendVerification(email) {
  const response = await request('usuarios/reenviar-verificacion', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
  if (!response.ok) throw new Error('No se pudo reenviar el correo');
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

// --- Recuperación de contraseña (código real por correo, ver server) ---

// Lanza Error con status y mensaje del server (404 = correo sin cuenta).
// Sin SMTP (dev), la respuesta trae devResetCode para mostrarse en pantalla.
export async function requestPasswordReset(email) {
  const response = await request('usuarios/recuperar', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error ?? 'No se pudo enviar el código');
    error.status = response.status;
    throw error;
  }
  return data;
}

// Confirma el código antes de pedir la contraseña nueva. 410 = vencido o
// demasiados intentos (hay que pedir otro código).
export async function validateResetCode(email, code) {
  const response = await request('usuarios/recuperar/validar', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error ?? 'No se pudo validar el código');
    error.status = response.status;
    throw error;
  }
  return data;
}

export async function resetPassword(email, code, password) {
  const response = await request('usuarios/restablecer', {
    method: 'POST',
    body: JSON.stringify({ email, code, password }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error ?? 'No se pudo actualizar la contraseña');
    error.status = response.status;
    throw error;
  }
  return data;
}

// Invalida el token en el servidor al cerrar sesión. Best-effort: si el API
// no responde, el localStorage se limpia igual (routes/auth.js).
export async function logoutSession() {
  try {
    await request('sesion', { method: 'DELETE' });
  } catch {
    // Sin conexión no hay nada que invalidar desde aquí.
  }
}
