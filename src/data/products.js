import { useSyncExternalStore } from 'react';
import { getAdminProducts } from './adminProducts';

// La taxonomía (categorías y atributos por categoría) refleja el formulario
// de "Agregar producto" del admin (src/pages/admin/ProductForm.jsx): Celulares
// llevan marca/almacenamiento/color, Fundas modelos compatibles, Cargadores
// entrada, Protectores tipo y privacidad. Los filtros del catálogo dependen
// de estos campos — si se agrega un atributo nuevo aquí, agregarlo también allá.
export const categories = [
  'Todos',
  'Celulares',
  'Fundas',
  'Cargadores',
  'Accesorios',
  'Protector de pantalla',
];

export const priceRanges = [
  { label: 'Todos', min: 0, max: Infinity },
  { label: 'Menos de $300', min: 0, max: 300 },
  { label: '$300 - $1,000', min: 300, max: 1000 },
  { label: '$1,000 - $10,000', min: 1000, max: 10000 },
  { label: 'Más de $10,000', min: 10000, max: Infinity },
];

// Slug de ruta (/catalogo/:category/:productId): minúsculas y espacios → guiones
// para que "Protector de pantalla" no genere %20 en la URL.
export function categorySlug(category) {
  return category.toLowerCase().replace(/\s+/g, '-');
}

// Las imágenes viven en public/images/products/<id>.svg. Se resuelven con
// BASE_URL para que funcionen igual en dev (/) y en producción bajo /AUTOCELLS/
// — mismo gotcha que el basename del router (ver CLAUDE.md).
function productImage(file) {
  return `${import.meta.env.BASE_URL}images/products/${file}.svg`;
}

// Catálogo estático vacío a propósito: los productos capturados a mano van
// aquí; los del admin (SQLite) se combinan abajo en el store del catálogo.
// Forma de cada producto: { id, name, category, brand, price,
// status: 'nuevo' | 'seminuevo', stock: 'disponible' | 'agotado', description,
// colors, más los atributos contextuales de su categoría (storage,
// compatibleModels, chargerInput, screenProtectorType, privacy). No definir
// image/images a mano: se asignan abajo a partir del id.
export const products = [];

// El nombre de archivo es el id del producto, así que la asignación es
// automática; los celulares suman una vista frontal para la galería del
// detalle. `image` (portada) es siempre `images[0]`.
for (const product of products) {
  product.images =
    product.category === 'Celulares'
      ? [productImage(product.id), productImage(`${product.id}-front`)]
      : [productImage(product.id)];
  product.image = product.images[0];
}

// --- Catálogo combinado (estáticos + productos capturados en el admin) ---

// El admin captura una sola variante (storage/color como string) y stock
// numérico; el catálogo público modela variantes como arreglos y el stock como
// 'disponible' | 'agotado', así que se traducen al leer del API. La foto ya
// viene como data URL (o null → los consumidores caen al ícono de categoría).
function normalizeAdminProduct(product) {
  return {
    ...product,
    storage: product.storage ? [product.storage] : undefined,
    colors: product.color ? [product.color] : undefined,
    compatibleModels: product.customCompatibleModel
      ? [...(product.compatibleModels ?? []), product.customCompatibleModel]
      : product.compatibleModels,
    stock: product.stock > 0 ? 'disponible' : 'agotado',
    // El número real de piezas, para topar cantidades en el carrito. Los
    // productos estáticos no lo tienen (undefined = sin tope en la UI; el
    // server igual valida el inventario al crear el pedido).
    stockCount: product.stock,
  };
}

// Store mínimo con useSyncExternalStore en vez de un Context: los consumidores
// (Catalog, ProductDetail, Home, CartContext, Breadcrumb) están regados por
// todo el árbol y el catálogo no necesita provider. `loaded` distingue "el API
// aún no responde" de "el producto no existe" (lo usa ProductDetail).
let snapshot = { products, loaded: false };
let inflight = null;
const listeners = new Set();

function getSnapshot() {
  return snapshot;
}

// Se refresca en cada suscripción (= montaje de página) para que un producto
// recién agregado en el admin aparezca al navegar al catálogo sin recargar.
function refreshCatalog() {
  inflight ??= getAdminProducts()
    .then((adminProducts) => {
      snapshot = {
        products: [...adminProducts.map(normalizeAdminProduct), ...products],
        loaded: true,
      };
    })
    .catch(() => {
      // Con el API caído, el catálogo estático sigue disponible.
      snapshot = { ...snapshot, loaded: true };
    })
    .finally(() => {
      inflight = null;
      for (const listener of listeners) listener();
    });
}

function subscribe(listener) {
  listeners.add(listener);
  refreshCatalog();
  return () => listeners.delete(listener);
}

export function useCatalog() {
  return useSyncExternalStore(subscribe, getSnapshot);
}
