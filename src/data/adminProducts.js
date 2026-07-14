// Cliente del API de productos (server/index.js + SQLite). Antes era un CRUD
// en memoria sembrado desde el catálogo mock; ahora los productos del admin
// persisten en la base de datos y todas las funciones son async.
// El id lo genera el servidor (slug del nombre + sufijo de tiempo).
import { apiUrl } from '../lib/api';

export async function getAdminProducts() {
  const response = await fetch(apiUrl('productos'));
  if (!response.ok) throw new Error('Error al consultar los productos');
  return response.json();
}

// Regresa null si el producto no existe (el form muestra "no encontrado").
export async function getAdminProduct(id) {
  const response = await fetch(apiUrl(`productos/${encodeURIComponent(id)}`));
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Error al consultar el producto');
  return response.json();
}

export async function addAdminProduct(data) {
  const response = await fetch(apiUrl('productos'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('No se pudo agregar el producto');
  return response.json();
}

export async function updateAdminProduct(id, data) {
  const response = await fetch(apiUrl(`productos/${encodeURIComponent(id)}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('No se pudo actualizar el producto');
  return response.json();
}

// Ancla (o desancla) el producto destacado que se muestra en el inicio.
// El server garantiza que solo haya uno: destacar este desmarca el anterior.
export async function setAdminProductFeatured(id, featured) {
  const response = await fetch(apiUrl(`productos/${encodeURIComponent(id)}/destacado`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ featured }),
  });
  if (!response.ok) throw new Error('No se pudo actualizar el producto destacado');
  return response.json();
}

export async function deleteAdminProduct(id) {
  const response = await fetch(apiUrl(`productos/${encodeURIComponent(id)}`), {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('No se pudo eliminar el producto');
  return true;
}
