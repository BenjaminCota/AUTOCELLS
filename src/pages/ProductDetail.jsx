import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MessageCircle, ShoppingCart, Check, PackageSearch } from 'lucide-react';
import { products } from '../data/products';
import ProductCard, { categoryIcons, priceFormatter } from '../components/ProductCard';
import Badge from '../components/Badge';
import { whatsappLink } from '../data/store';
import { useCart } from '../context/CartContext';

const colorSwatches = {
  Negro: '#1d1d1f',
  Blanco: '#f5f5f7',
  Azul: '#2bb3d3',
  Rojo: '#ef4444',
  Verde: '#22c55e',
  Transparente: '#e5e4e7',
};

export default function ProductDetail() {
  const { productId } = useParams();
  const { addItem } = useCart();
  const product = products.find((item) => item.id === productId);

  const [selectedStorage, setSelectedStorage] = useState(product?.storage?.[0]);
  const [selectedColor, setSelectedColor] = useState(product?.colors?.[0]);
  const [added, setAdded] = useState(false);

  // El router no remonta este componente en una navegación solo-de-parámetro
  // (catalogo/:category/:productId), así que la selección debe resetearse a mano.
  useEffect(() => {
    setSelectedStorage(product?.storage?.[0]);
    setSelectedColor(product?.colors?.[0]);
    setAdded(false);
  }, [productId]);

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
  const relatedProducts = products
    .filter((item) => item.category === product.category && item.id !== product.id)
    .slice(0, 4);

  const whatsappHref = whatsappLink(
    `Hola, me interesa el ${product.name} (${priceFormatter.format(product.price)}). ¿Sigue disponible?`,
  );

  const isAgotado = product.stock === 'agotado';

  function handleAddToCart() {
    // Agrega la variante seleccionada; el contexto abre el drawer como confirmación.
    addItem(product, { storage: selectedStorage, color: selectedColor });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-2">
        {/* Galería */}
        <div>
          <div className="flex aspect-square items-center justify-center rounded-card bg-bg-alt">
            <Icon className="h-32 w-32 text-secondary/30" strokeWidth={1.25} />
          </div>
          <div className="mt-3 grid grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((index) => (
              <button
                key={index}
                type="button"
                className="flex aspect-square items-center justify-center rounded-card border-2 border-primary/30 bg-bg-alt transition-colors hover:border-primary"
              >
                <Icon className="h-8 w-8 text-secondary/30" strokeWidth={1.25} />
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {product.category} · {product.brand}
          </p>
          <h1 className="text-2xl font-bold text-secondary sm:text-3xl">{product.name}</h1>

          <div className="flex items-center gap-2">
            <Badge variant={product.status}>{product.status === 'nuevo' ? 'Nuevo' : 'Seminuevo'}</Badge>
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
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-card border border-success-dark px-6 py-3.5 text-base font-semibold text-success-dark transition-colors hover:bg-success/10"
            >
              <MessageCircle className="h-5 w-5" />
              Preguntar por WhatsApp
            </a>
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
