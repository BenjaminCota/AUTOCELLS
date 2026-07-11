import { Link } from 'react-router-dom';
import { Smartphone, Shield, BatteryCharging, Cable } from 'lucide-react';
import Badge from './Badge';
import { categorySlug } from '../data/products';

export const categoryIcons = {
  iPhones: Smartphone,
  Fundas: Shield,
  Cargadores: BatteryCharging,
  Accesorios: Cable,
};

export const priceFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
});

export default function ProductCard({ product }) {
  const Icon = categoryIcons[product.category] ?? Smartphone;
  const isAgotado = product.stock === 'agotado';

  return (
    <div className="flex flex-col overflow-hidden rounded-card bg-white shadow-sm transition-[transform,box-shadow] duration-200 ease-snappy hover:-translate-y-1 hover:shadow-md">
      <div className="relative flex aspect-square items-center justify-center bg-bg-alt">
        <Icon className="h-16 w-16 text-secondary/30" strokeWidth={1.5} />
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
          {product.category} · {product.brand}
        </p>
        <h3 className="font-semibold text-secondary">{product.name}</h3>
        <p className="mt-1 text-lg font-bold text-secondary">{priceFormatter.format(product.price)}</p>

        <Link
          to={`/catalogo/${categorySlug(product.category)}/${product.id}`}
          className="mt-3 rounded-card bg-primary-dark px-4 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          Ver detalle
        </Link>
      </div>
    </div>
  );
}
