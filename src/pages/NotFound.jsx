import { Link, useLocation } from 'react-router-dom';
import { Home, Grid2x2 } from 'lucide-react';
import Logo from '../components/Logo';

export default function NotFound() {
  const { pathname } = useLocation();

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center gap-6 px-4 py-24 text-center">
      <span className="inline-flex items-center justify-center rounded-full border-4 border-primary/20 bg-primary/10 p-2.5">
        <Logo size={80} />
      </span>

      <div>
        <p className="text-7xl font-bold tracking-wide text-primary-dark">404</p>
        <h1 className="mt-2 text-2xl font-bold uppercase tracking-wide text-secondary sm:text-3xl">
          Esta línea está fuera de servicio
        </h1>
        <p className="mt-3 max-w-prose text-muted">
          La página que buscas no existe o cambió de dirección. Revisa el enlace o vuelve a un lugar conocido.
        </p>
        <p className="mt-1 break-all text-xs text-muted/70">Ruta solicitada: {pathname}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          to="/"
          className="flex items-center justify-center gap-2 rounded-card bg-primary-dark px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          <Home className="h-4 w-4" />
          Volver al inicio
        </Link>
        <Link
          to="/catalogo"
          className="flex items-center justify-center gap-2 rounded-card border border-secondary/20 px-5 py-2.5 text-sm font-semibold text-secondary transition-colors hover:border-primary-dark hover:text-primary-dark"
        >
          <Grid2x2 className="h-4 w-4" />
          Ver catálogo
        </Link>
      </div>
    </div>
  );
}
