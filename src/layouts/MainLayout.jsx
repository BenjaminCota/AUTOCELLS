import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Breadcrumb from '../components/Breadcrumb';
import CartDrawer from '../components/CartDrawer';

// Orden visual del nav: decide desde qué lado entra la página nueva.
// Ir hacia adelante (Inicio→Catálogo) desliza desde la derecha; regresar, desde la izquierda.
const NAV_ORDER = ['/', '/catalogo', '/servicios', '/contacto', '/login'];

function sectionIndex(pathname) {
  if (pathname === '/') return 0;
  const index = NAV_ORDER.findIndex((route, i) => i > 0 && pathname.startsWith(route));
  // Rutas fuera del nav (ej. 404) se tratan como "más adelante": entran desde la derecha.
  return index === -1 ? NAV_ORDER.length : index;
}

function slideDirection(from, to) {
  if (from === to) return null; // carga inicial (la cubre el splash): sin animación
  const fromIndex = sectionIndex(from);
  const toIndex = sectionIndex(to);
  if (toIndex !== fromIndex) return toIndex > fromIndex ? 'right' : 'left';
  // Misma sección (Catálogo→detalle de producto): profundizar entra desde la derecha.
  const depth = (p) => p.split('/').filter(Boolean).length;
  return depth(to) >= depth(from) ? 'right' : 'left';
}

// Breadcrumb se omite en Home según el brief de diseño.
export default function MainLayout() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  // La ruta anterior se recuerda en un ref para calcular la dirección durante el render.
  const previousPathnameRef = useRef(pathname);
  const direction = slideDirection(previousPathnameRef.current, pathname);

  useEffect(() => {
    previousPathnameRef.current = pathname;
    // Sin esto, la página nueva entraría deslizándose con el scroll a media altura.
    window.scrollTo(0, 0);
  }, [pathname]);

  const animationClass =
    direction === 'right' ? 'animate-page-in-right' : direction === 'left' ? 'animate-page-in-left' : '';

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      {!isHome && <Breadcrumb />}
      {/* key={pathname} remonta el <main> en cada navegación para que la animación se reproduzca. */}
      <main key={pathname} className={`flex-1 ${animationClass}`}>
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
