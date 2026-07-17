import { Link } from 'react-router-dom';
import { Smartphone, Shield, BatteryCharging, Headphones, Layers, ShoppingCart, ShieldCheck, ShieldOff } from 'lucide-react';
import Badge from './Badge';
import { categorySlug, statusLabel } from '../data/products';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { warrantyLabel } from '../lib/warranty';

export const categoryIcons = {
  Celulares: Smartphone,
  Fundas: Shield,
  Cargadores: BatteryCharging,
  Accesorios: Headphones,
  // Vidrio templado: capas sobre la pantalla (antes Sparkles, cliché de IA).
  'Protector de pantalla': Layers,
};

export const priceFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
});

export default function ProductCard({ product }) {
  const Icon = categoryIcons[product.category] ?? Smartphone;
  const isAgotado = product.stock === 'agotado';
  // Existencias bajas → genera urgencia. stockCount solo lo traen los productos
  // del admin (los estáticos son undefined → no se muestra número).
  const lowStock =
    !isAgotado && typeof product.stockCount === 'number' && product.stockCount > 0 && product.stockCount <= 5;
  // null también para celulares marcados "sin garantía" — ahí se dice explícito.
  const warranty = warrantyLabel(product);
  const { addItem } = useCart();
  const toast = useToast();

  function handleQuickAdd() {
    // Variante por defecto (primera opción), igual que el estado inicial de
    // ProductDetail; addItem abre el drawer como confirmación.
    addItem(product, { storage: product.storage?.[0], color: product.colors?.[0] });
    toast.success(`${product.name} agregado al carrito.`);
  }

  const detailHref = `/catalogo/${categorySlug(product.category)}/${product.id}`;

  return (
    // Tarjeta estilo Mercado Libre: TODA la tarjeta navega al detalle (enlace
    // "estirado" con after:inset-0 en el nombre — así el HTML sigue siendo
    // válido, sin botones dentro de un <a>). El carrito es un botón flotante
    // compacto que queda encima del enlace con z-10.
    <div className="group relative flex h-full flex-col overflow-hidden rounded-card border border-secondary/10 bg-white transition-[border-color,box-shadow] duration-200 ease-snappy hover:border-secondary/25 hover:shadow-[0_16px_36px_-18px_rgba(88,89,91,0.5)]">
      <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-white">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-contain p-3 transition-transform duration-300 ease-snappy group-hover:scale-[1.04]"
          />
        ) : (
          // Fallback para productos sin imagen (ej. los creados desde el admin).
          <Icon className="h-16 w-16 text-secondary/25 transition-transform duration-300 ease-snappy group-hover:scale-[1.04]" strokeWidth={1.5} />
        )}
        <div className="absolute left-3 top-3">
          <Badge variant={product.status}>{statusLabel(product.status)}</Badge>
        </div>
        {isAgotado && (
          <div className="absolute right-3 top-3">
            <Badge variant="agotado">Agotado</Badge>
          </div>
        )}
      </div>

      {/* pr-14 deja sitio al botón flotante del carrito. */}
      <div className="flex flex-1 flex-col border-t border-secondary/10 p-4 pr-14">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          {/* Solo los celulares llevan marca (los del admin no la piden en otras categorías). */}
          {product.category}
          {product.brand ? ` · ${product.brand}` : ''}
        </p>
        <h3 className="mt-0.5 line-clamp-2 min-h-10 text-sm font-medium leading-snug text-secondary">
          <Link
            to={detailHref}
            className="transition-colors after:absolute after:inset-0 group-hover:text-primary-dark"
          >
            {product.name}
          </Link>
        </h3>
        <p className="mt-1.5 text-2xl font-bold text-secondary">{priceFormatter.format(product.price)}</p>
        {/* Línea verde tipo "Envío gratis" de ML: aquí es la garantía real. */}
        {product.category === 'Celulares' && (
          <p className="mt-1.5 flex items-center gap-1 text-xs font-medium">
            {warranty ? (
              <>
                <ShieldCheck className="h-3.5 w-3.5 text-success-dark" />
                <span className="text-success-dark">{warranty}</span>
              </>
            ) : (
              <>
                <ShieldOff className="h-3.5 w-3.5 text-muted" />
                <span className="text-muted">Sin garantía</span>
              </>
            )}
          </p>
        )}
        <p className="mt-auto pt-1.5 text-xs font-semibold">
          {isAgotado ? (
            <span className="text-muted">Sin existencias</span>
          ) : lowStock ? (
            <span className="text-danger-dark">Quedan {product.stockCount}</span>
          ) : (
            <span className="text-success-dark">Disponible</span>
          )}
        </p>
      </div>

      <button
        type="button"
        disabled={isAgotado}
        onClick={handleQuickAdd}
        aria-label={`Agregar ${product.name} al carrito`}
        title="Agregar al carrito"
        className="absolute bottom-3.5 right-3.5 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-secondary/15 bg-white text-primary-dark shadow-sm transition-[background-color,color,transform,border-color] duration-150 ease-snappy enabled:hover:border-primary-dark enabled:hover:bg-primary-dark enabled:hover:text-white enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ShoppingCart className="h-5 w-5" />
      </button>
    </div>
  );
}
