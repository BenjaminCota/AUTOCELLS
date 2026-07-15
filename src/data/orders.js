// Cliente del API de pedidos (server/index.js + SQLite). El folio se genera
// en el servidor (allí sí hay un punto central que evita colisiones) y los
// pedidos demo viven como seeds de la base de datos.
import { apiUrl } from '../lib/api';
import { authHeaders } from '../routes/auth';

// 'entregado-vendido' es el estado final: el cliente pasó a la tienda y pagó
// en efectivo (único método de pago disponible).
export const orderStatuses = ['pendiente', 'entregado-vendido', 'cancelado'];

// Todo /pedidos exige sesión: el server regresa solo los pedidos de la cuenta
// del token (o todos, si el token es del admin) — el ?email= es cortesía para
// el admin, a un cliente se le ignora.
export async function getWebOrders(email) {
  const query = email ? `?email=${encodeURIComponent(email)}` : '';
  const response = await fetch(apiUrl(`pedidos${query}`), { headers: authHeaders() });
  if (!response.ok) throw new Error('Error al consultar los pedidos');
  return response.json();
}

// Adjunta status y el mensaje del servidor al Error: el checkout distingue el
// 403 de cuenta sin verificar para mostrar su aviso con el botón de reenvío.
export async function addWebOrder(order) {
  const response = await fetch(apiUrl('pedidos'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(order),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const error = new Error(data.error ?? 'No se pudo registrar el pedido');
    error.status = response.status;
    throw error;
  }
  return response.json();
}

export async function updateWebOrderStatus(id, status) {
  const response = await fetch(apiUrl(`pedidos/${encodeURIComponent(id)}/estado`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error('No se pudo actualizar el pedido');
  return true;
}
