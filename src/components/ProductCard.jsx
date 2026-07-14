import { Link } from 'react-router-dom';
import { Smartphone, Shield, BatteryCharging, Cable, Sparkles, ShoppingCart } from 'lucide-react';
import Badge from './Badge';
import { categorySlug } from '../data/products';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

export const categoryIcons = {
  Celulares: Smartphone,
  Fundas: Shield,
  Cargadores: BatteryCharging,
  Accesorios: Cable,
  'Protector de pantalla': Sparkles,
};

export const priceFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
});

export default function ProductCard({ product }) {
  const Icon = categoryIcons[product.category] ?? Smartphone;
  const isAgotado = product.stock === 'agotado';
  const { addItem } = useCart();
  const toast = useToast();

  function handleQuickAdd() {
    // Variante por defecto (primera opción), igual que el estado inicial de
    // ProductDetail; addItem abre el drawer como confirmación.
    addItem(product, { storage: product.storage?.[0], color: product.colors?.[0] });
    toast.success(`${product.name} agregado al carrito.`);
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-card bg-white shadow-sm transition-[transform,box-shadow] duration-200 ease-snappy hover:-translate-y-1 hover:shadow-md">
      <div className="relative flex aspect-square items-center justify-center bg-bg-alt">
        {product.image ? (
          <img src={product.image} alt={product.name} loading="lazy" className="h-full w-full object-contain p-4" />
        ) : (
          // Fallback para productos sin imagen (ej. los creados desde el admin).
          <Icon className="h-16 w-16 text-secondary/30" strokeWidth={1.5} />
        )}
        <div className="absolute left-3 top-3">
          <Badge variant={product.status}>{product.status === 'nuevo' ? 'Nuevo' : 'Seminuevo'}</Badge>
        </div>
        {isAgotado && (
          <div className="absolute right-3 top-3">
            <Badge variant="agotado">Agotado</Badge>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          {/* Solo los celulares llevan marca (los del admin no la piden en otras categorías). */}
          {product.category}
          {product.brand ? ` · ${product.brand}` : ''}
        </p>
        <h3 className="font-semibold text-secondary">{product.name}</h3>
        <p className="mt-1 text-lg font-bold text-secondary">{priceFormatter.format(product.price)}</p>

        <div className="mt-3 flex gap-2">
          <Link
            to={`/catalogo/${categorySlug(product.category)}/${product.id}`}
            className="flex-1 rounded-card bg-primary-dark px-4 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            Ver detalle
          </Link>
          <button
            type="button"
            disabled={isAgotado}
            onClick={handleQuickAdd}
            aria-label={`Agregar ${product.name} al carrito`}
            title="Agregar al carrito"
            className="rounded-card border border-secondary/20 px-3 text-secondary transition-colors enabled:hover:border-primary-dark enabled:hover:text-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
