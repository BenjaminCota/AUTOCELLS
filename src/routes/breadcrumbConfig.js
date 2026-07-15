import { products } from '../data/products';

// Etiquetas legibles para segmentos de ruta estáticos.
// Los segmentos dinámicos sin entrada aquí (ids/slugs desconocidos) se humanizan
// automáticamente en Breadcrumb.jsx.
export const breadcrumbNameMap = {
  catalogo: 'Catálogo',
  celulares: 'Celulares',
  fundas: 'Fundas',
  cargadores: 'Cargadores',
  accesorios: 'Accesorios',
  'protector-de-pantalla': 'Protector de pantalla',
  servicios: 'Servicios',
  contacto: 'Contacto',
  comprar: 'Finalizar compra',
  cuenta: 'Mi cuenta',
  login: 'Iniciar sesión',
  registro: 'Crear cuenta',
  'verificar-correo': 'Verificar correo',
  recuperar: 'Recuperar contraseña',
  admin: 'Admin',
  dashboard: 'Dashboard',
  productos: 'Productos',
  pedidos: 'Pedidos',
  nuevo: 'Nuevo producto',
  editar: 'Editar producto',
  // El id de cada producto se resuelve a su nombre real (respeta mayúsculas de marca/modelo).
  ...Object.fromEntries(products.map((product) => [product.id, product.name])),
};
