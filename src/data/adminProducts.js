import { products as catalogProducts } from './products';

// Store en memoria para el CRUD del admin (sin backend todavía).
// Se inicializa desde el catálogo público pero vive independiente: editar/eliminar
// aquí no debe tocar los datos mock que usa el sitio público.
let adminProducts = catalogProducts.map((product, index) => ({
  id: product.id,
  name: product.name,
  category: product.category,
  price: product.price,
  stock: product.stock === 'agotado' ? 0 : 4 + ((index * 3) % 12),
  status: product.status,
  description: product.description ?? '',
}));

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function getAdminProducts() {
  return adminProducts;
}

export function getAdminProduct(id) {
  return adminProducts.find((product) => product.id === id);
}

export function addAdminProduct(data) {
  const newProduct = { id: `${slugify(data.name)}-${Date.now().toString(36)}`, ...data };
  adminProducts = [newProduct, ...adminProducts];
  return newProduct;
}

export function updateAdminProduct(id, data) {
  adminProducts = adminProducts.map((product) => (product.id === id ? { ...product, ...data } : product));
}

export function deleteAdminProduct(id) {
  adminProducts = adminProducts.filter((product) => product.id !== id);
}
