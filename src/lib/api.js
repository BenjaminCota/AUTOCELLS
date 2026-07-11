// Manual de despliegue (Cambio 2): las llamadas al API deben ir a
// /AUTOCELLS/api/..., NUNCA a /api/... a secas. BASE_URL sale del
// `base` configurado en vite.config.js, así que este helper arma la URL
// correcta tanto en dev como en el servidor.
//
// Todavía no hay backend ni base de datos. Cuando existan, todas las
// llamadas deben pasar por aquí:
//
//   import { apiUrl } from '../lib/api';
//   fetch(apiUrl('productos'))        // → /AUTOCELLS/api/productos
//   fetch(apiUrl('pedidos/12'))       // → /AUTOCELLS/api/pedidos/12

export function apiUrl(path = '') {
  return `${import.meta.env.BASE_URL}api/${String(path).replace(/^\/+/, '')}`;
}
