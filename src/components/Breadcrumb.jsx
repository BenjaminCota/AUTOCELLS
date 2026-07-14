import { Link, useLocation } from 'react-router-dom';
import { breadcrumbNameMap } from '../routes/breadcrumbConfig';
import { useCatalog } from '../data/products';

function humanize(segment) {
  return decodeURIComponent(segment)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

// Se genera automáticamente a partir de la ruta actual. No se renderiza en Home.
export default function Breadcrumb() {
  const { pathname } = useLocation();
  const { products } = useCatalog();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  // Los ids de productos del admin no están en el mapa estático (los genera el
  // server), así que se resuelven contra el catálogo cargado antes de humanizar.
  const crumbs = segments.map((segment, index) => ({
    path: '/' + segments.slice(0, index + 1).join('/'),
    label:
      breadcrumbNameMap[segment] ??
      products.find((product) => product.id === segment)?.name ??
      humanize(segment),
    isLast: index === segments.length - 1,
  }));

  return (
    <nav aria-label="Breadcrumb" className="border-b border-secondary/10 bg-bg-alt">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        {/* Escritorio: recorrido completo */}
        <ol className="hidden items-center gap-2 text-sm font-medium md:flex">
          <HomeCrumb />
          {crumbs.map((crumb) => (
            <CrumbItem key={crumb.path} {...crumb} />
          ))}
        </ol>

        {/* Móvil: trunca niveles intermedios con "..." */}
        <ol className="flex items-center gap-2 text-sm font-medium md:hidden">
          <HomeCrumb />
          {crumbs.length > 1 && (
            <>
              <Separator />
              <li className="text-muted">…</li>
            </>
          )}
          <CrumbItem {...crumbs[crumbs.length - 1]} />
        </ol>
      </div>
    </nav>
  );
}

function HomeCrumb() {
  return (
    <li>
      <Link to="/" className="text-secondary transition-colors hover:text-primary-dark">
        Inicio
      </Link>
    </li>
  );
}

function Separator() {
  return (
    <li aria-hidden="true" className="text-secondary/40">
      /
    </li>
  );
}

function CrumbItem({ path, label, isLast }) {
  return (
    <>
      <Separator />
      <li>
        {isLast ? (
          <span aria-current="page" className="text-primary-dark">
            {label}
          </span>
        ) : (
          <Link to={path} className="text-secondary transition-colors hover:text-primary-dark">
            {label}
          </Link>
        )}
      </li>
    </>
  );
}
