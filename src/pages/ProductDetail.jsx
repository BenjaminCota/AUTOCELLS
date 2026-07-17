import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ShoppingBag, ShoppingCart, Check, PackageSearch, ShieldCheck, ShieldOff } from 'lucide-react';
import { useCatalog, statusLabel } from '../data/products';
import { warrantyMonths, warrantyLabel } from '../lib/warranty';
import ProductCard, { categoryIcons, priceFormatter } from '../components/ProductCard';
import Badge from '../components/Badge';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

const colorSwatches = {
  Negro: '#1d1d1f',
  Blanco: '#f5f5f7',
  Azul: '#2bb3d3',
  'Azul Marino': '#1e3a5f',
  Rojo: '#ef4444',
  Verde: '#22c55e',
  Gris: '#8e8e93',
  Morado: '#a78bfa',
  Transparente: '#e5e4e7',
};

export default function ProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addItem, closeCart } = useCart();
  const toast = useToast();
  const { products, loaded } = useCatalog();
  const product = products.find((item) => item.id === productId);

  const [selectedStorage, setSelectedStorage] = useState(product?.storage?.[0]);
  const [selectedColor, setSelectedColor] = useState(product?.colors?.[0]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [added, setAdded] = useState(false);

  // El router no remonta este componente en una navegación solo-de-parámetro
  // (catalogo/:category/:productId), así que la selección debe resetearse a
  // mano. Depende de `product` (no de productId): los productos del admin
  // llegan async y la selección inicial debe aplicarse también en ese momento.
  useEffect(() => {
    setSelectedStorage(product?.storage?.[0]);
    setSelectedColor(product?.colors?.[0]);
    setSelectedImage(0);
    setAdded(false);
  }, [product]);

  // Mientras el API no responde no se sabe si el producto existe (los del
  // admin llegan async); mostrar "no encontrado" aquí sería un falso negativo.
  if (!product && !loaded) {
    return <p className="py-16 text-center text-muted">Cargando producto…</p>;
  }

  if (!product) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-24 text-center">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-danger/10">
          <PackageSearch className="h-8 w-8 text-danger-dark" strokeWidth={1.5} />
        </span>
        <h1 className="text-3xl font-bold uppercase tracking-wide text-secondary">Producto no encontrado</h1>
        <p className="max-w-prose text-muted">
          El producto que buscas ya no está disponible o el enlace es incorrecto. Puedes verlo en nuestro catálogo actualizado.
        </p>
        <Link
          to="/catalogo"
          className="rounded-card bg-primary-dark px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          Volver al catálogo
        </Link>
      </div>
    );
  }

  const Icon = categoryIcons[product.category] ?? ShoppingCart;
  const images = product.images ?? (product.image ? [product.image] : []);
  const relatedProducts = products
    .filter((item) => item.category === product.category && item.id !== product.id)
    .slice(0, 4);

  const isAgotado = product.stock === 'agotado';

  function handleAddToCart() {
    // Agrega la variante seleccionada; el contexto abre el drawer como confirmación.
    addItem(product, { storage: selectedStorage, color: selectedColor });
    toast.success(`${product.name} agregado al carrito.`);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  function handleBuyNow() {
    // Compra directa: al carrito y al formulario de pago, sin pasar por el
    // drawer (addItem lo abre, por eso se cierra antes de navegar).
    addItem(product, { storage: selectedStorage, color: selectedColor });
    closeCart();
    navigate('/comprar');
  }

  return (
    <div className="mx-auto max-w-[1800px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-2">
        {/* Galería */}
        <div>
          <div className="flex aspect-square items-center justify-center rounded-card bg-bg-alt">
            {images.length > 0 ? (
              <img
                src={images[selectedImage] ?? images[0]}
                alt={product.name}
                className="h-full w-full object-contain p-8"
              />
            ) : (
              <Icon className="h-32 w-32 text-secondary/30" strokeWidth={1.25} />
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-3">
              {images.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  aria-label={`Ver imagen ${index + 1} de ${product.name}`}
                  onClick={() => setSelectedImage(index)}
                  className={`flex aspect-square items-center justify-center rounded-card border-2 bg-bg-alt transition-colors ${
                    selectedImage === index ? 'border-primary-dark' : 'border-primary/30 hover:border-primary'
                  }`}
                >
                  <img src={image} alt="" className="h-full w-full object-contain p-2" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {/* Solo los celulares llevan marca (los del admin no la piden en otras categorías). */}
            {product.category}
            {product.brand ? ` · ${product.brand}` : ''}
          </p>
          <h1 className="text-2xl font-bold text-secondary sm:text-3xl">{product.name}</h1>

          <div className="flex items-center gap-2">
            <Badge variant={product.status}>{statusLabel(product.status)}</Badge>
            {product.stock === 'agotado' && <Badge variant="agotado">Agotado</Badge>}
          </div>

          <p className="text-3xl font-bold text-secondary">{priceFormatter.format(product.price)}</p>

          {product.storage && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                Almacenamiento
              </p>
              <div className="flex flex-wrap gap-2">
                {product.storage.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSelectedStorage(option)}
                    className={`rounded-card border px-4 py-2 text-sm font-medium transition-colors ${
                      selectedStorage === option
                        ? 'border-primary-dark bg-primary-dark text-white'
                        : 'border-secondary/20 text-secondary hover:border-primary-dark hover:text-primary-dark'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.colors && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                Color{selectedColor ? `: ${selectedColor}` : ''}
              </p>
              <div className="flex flex-wrap gap-3">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={color}
                    onClick={() => setSelectedColor(color)}
                    className={`h-9 w-9 rounded-full border-2 transition-transform ${
                      selectedColor === color ? 'scale-110 border-primary-dark' : 'border-secondary/20'
                    }`}
                    style={{ backgroundColor: colorSwatches[color] ?? '#cccccc' }}
                  />
                ))}
              </div>
            </div>
          )}

          <p className="text-muted">{product.description}</p>

          {/* La regla de garantía vive en lib/warranty.js — solo celulares. */}
          {product.category === 'Celulares' ? (
            warrantyMonths(product) ? (
              <p className="flex items-center gap-2 rounded-card bg-success/10 px-4 py-3 text-sm font-semibold text-success-dark">
                <ShieldCheck className="h-5 w-5 shrink-0" />
                {warrantyLabel(product)} incluida en tu compra.
              </p>
            ) : (
              <p className="flex items-center gap-2 rounded-card bg-bg-alt px-4 py-3 text-sm font-medium text-muted">
                <ShieldOff className="h-5 w-5 shrink-0" />
                Este equipo se vende sin garantía.
              </p>
            )
          ) : (
            <p className="text-xs text-muted">
              Los accesorios no incluyen garantía — solo los celulares la manejan (1 mes; iPhone 17, 2 meses).
            </p>
          )}

          <div className="mt-2 flex flex-col gap-3">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isAgotado}
              className="flex items-center justify-center gap-2 rounded-card bg-primary-dark px-6 py-3.5 text-base font-semibold text-white transition-colors enabled:hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-secondary/20 disabled:text-secondary/50"
            >
              {isAgotado ? null : added ? <Check className="h-5 w-5" /> : <ShoppingCart className="h-5 w-5" />}
              {isAgotado ? 'Producto agotado' : added ? 'Agregado al carrito' : 'Agregar al carrito'}
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={isAgotado}
              className="flex items-center justify-center gap-2 rounded-card border border-success-dark px-6 py-3.5 text-base font-semibold text-success-dark transition-colors enabled:hover:bg-success/10 disabled:cursor-not-allowed disabled:border-secondary/20 disabled:text-secondary/40"
            >
              <ShoppingBag className="h-5 w-5" />
              Comprar
            </button>
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="text-xl font-bold uppercase tracking-wide text-secondary">Productos relacionados</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
            {relatedProducts.map((related) => (
              <ProductCard key={related.id} product={related} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
