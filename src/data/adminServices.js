// Cliente del API de servicios (server/index.js + SQLite). Antes era un CRUD
// en memoria que se reseteaba al recargar; ahora los servicios persisten en la
// base y todas las funciones son async. El id lo genera el servidor (slug del
// nombre + sufijo de tiempo). GET es público; las mutaciones exigen el token
// del admin (el server valida el rol contra la base, no contra localStorage).
import { apiUrl } from '../lib/api';
import { authHeaders } from '../routes/auth';

export async function getAdminServices() {
  const response = await fetch(apiUrl('servicios'));
  if (!response.ok) throw new Error('Error al consultar los servicios');
  return response.json();
}

export async function addAdminService(data) {
  const response = await fetch(apiUrl('servicios'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('No se pudo agregar el servicio');
  return response.json();
}

export async function updateAdminService(id, data) {
  const response = await fetch(apiUrl(`servicios/${encodeURIComponent(id)}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('No se pudo actualizar el servicio');
  return response.json();
}

export async function deleteAdminService(id) {
  const response = await fetch(apiUrl(`servicios/${encodeURIComponent(id)}`), {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error('No se pudo eliminar el servicio');
  return true;
}
