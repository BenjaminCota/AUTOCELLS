import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { isAdmin } from './auth';

// Envuelve las rutas /admin/*. Exige rol admin (no basta con tener sesión):
// un cliente registrado no debe poder entrar al panel.
export default function ProtectedRoute() {
  const location = useLocation();

  if (!isAdmin()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
