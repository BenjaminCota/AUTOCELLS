// Cliente del API de pedidos (server/index.js + SQLite). El folio se genera
// en el servidor (allí sí hay un punto central que evita colisiones) y los
// pedidos demo viven como seeds de la base de datos.
import { apiUrl } from '../lib/api';

// 'entregado-vendido' es el estado final: el cliente pasó a la tienda y pagó
// en efectivo (único método de pago disponible).
export const orderStatuses = ['pendiente', 'entregado-vendido', 'cancelado'];

export async function getWebOrders(email) {
  const query = email ? `?email=${encodeURIComponent(email)}` : '';
  const response = await fetch(apiUrl(`pedidos${query}`));
  if (!response.ok) throw new Error('Error al consultar los pedidos');
  return response.json();
}

export async function addWebOrder(order) {
  const response = await fetch(apiUrl('pedidos'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order),
  });
  if (!response.ok) throw new Error('No se pudo registrar el pedido');
  return response.json();
}

export async function updateWebOrderStatus(id, status) {
  const response = await fetch(apiUrl(`pedidos/${encodeURIComponent(id)}/estado`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error('No se pudo actualizar el pedido');
  return true;
}
