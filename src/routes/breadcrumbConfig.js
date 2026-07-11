import { products } from '../data/products';

// Etiquetas legibles para segmentos de ruta estáticos.
// Los segmentos dinámicos sin entrada aquí (ids/slugs desconocidos) se humanizan
// automáticamente en Breadcrumb.jsx.
export const breadcrumbNameMap = {
  catalogo: 'Catálogo',
  iphones: 'iPhones',
  fundas: 'Fundas',
  cargadores: 'Cargadores',
  accesorios: 'Accesorios',
  servicios: 'Servicios',
  contacto: 'Contacto',
  login: 'Iniciar sesión',
  admin: 'Admin',
  dashboard: 'Dashboard',
  productos: 'Productos',
  pedidos: 'Pedidos',
  nuevo: 'Nuevo producto',
  editar: 'Editar producto',
  // El id de cada producto se resuelve a su nombre real (respeta mayúsculas de marca/modelo).
  ...Object.fromEntries(products.map((product) => [product.id, product.name])),
};
