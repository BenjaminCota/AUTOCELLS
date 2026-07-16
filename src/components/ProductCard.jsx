import { Link } from 'react-router-dom';
import { Smartphone, Shield, BatteryCharging, Headphones, Layers, ShoppingCart, ShieldCheck, ShieldOff, ArrowRight } from 'lucide-react';
import Badge from './Badge';
import { categorySlug } from '../data/products';
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
    <div className="group flex flex-col overflow-hidden rounded-card border border-secondary/10 bg-white transition-[transform,border-color,box-shadow] duration-200 ease-snappy hover:-translate-y-1 hover:border-primary-dark/25 hover:shadow-[0_18px_38px_-20px_rgba(14,116,144,0.45)]">
      <Link
        to={detailHref}
        aria-label={`Ver ${product.name}`}
        className="relative flex aspect-square items-center justify-center overflow-hidden bg-gradient-to-b from-bg-alt to-white"
      >
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-contain p-4 transition-transform duration-300 ease-snappy group-hover:scale-105"
          />
        ) : (
          // Fallback para productos sin imagen (ej. los creados desde el admin).
          <Icon className="h-16 w-16 text-secondary/25 transition-transform duration-300 ease-snappy group-hover:scale-105" strokeWidth={1.5} />
        )}
        <div className="absolute left-3 top-3">
          <Badge variant={product.status}>{product.status === 'nuevo' ? 'Nuevo' : 'Seminuevo'}</Badge>
        </div>
        {isAgotado && (
          <div className="absolute right-3 top-3">
            <Badge variant="agotado">Agotado</Badge>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          {/* Solo los celulares llevan marca (los del admin no la piden en otras categorías). */}
          {product.category}
          {product.brand ? ` · ${product.brand}` : ''}
        </p>
        <h3 className="mt-1 font-semibold leading-snug text-secondary">
          <Link to={detailHref} className="transition-colors group-hover:text-primary-dark">
            {product.name}
          </Link>
        </h3>
        {product.category === 'Celulares' && (
          <p className="mt-1.5 flex items-center gap-1 text-xs text-muted">
            {warranty ? (
              <ShieldCheck className="h-3.5 w-3.5 text-success-dark" />
            ) : (
              <ShieldOff className="h-3.5 w-3.5" />
            )}
            {warranty ?? 'Sin garantía'}
          </p>
        )}

        <div className="mt-auto pt-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xl font-bold text-secondary">{priceFormatter.format(product.price)}</p>
            {/* Disponibilidad: agotado / pocas piezas (urgencia) / disponible. */}
            {isAgotado ? (
              <span className="text-xs font-semibold text-muted">Sin existencias</span>
            ) : lowStock ? (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-danger-dark">
                <span className="h-1.5 w-1.5 rounded-full bg-danger-dark" />
                Quedan {product.stockCount}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-success-dark">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                Disponible
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={isAgotado}
            onClick={handleQuickAdd}
            aria-label={`Agregar ${product.name} al carrito`}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-card bg-primary-dark px-4 py-2.5 text-sm font-semibold text-white transition-[background-color,transform] duration-150 ease-snappy enabled:hover:bg-primary-hover enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ShoppingCart className="h-4 w-4" />
            {isAgotado ? 'Agotado' : 'Agregar al carrito'}
          </button>
          <Link
            to={detailHref}
            className="group/ver mt-2 flex w-full items-center justify-center gap-1.5 rounded-card border border-secondary/20 px-4 py-2 text-sm font-semibold text-secondary transition-colors hover:border-primary-dark hover:text-primary-dark"
          >
            Ver detalles
            <ArrowRight className="h-4 w-4 transition-transform duration-200 ease-snappy group-hover/ver:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
