import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Menu, X, ShoppingCart } from 'lucide-react';
import Logo from './Logo';
import { useCart } from '../context/CartContext';

// Botón del carrito con badge de conteo; abre el drawer (CartDrawer en MainLayout).
function CartButton({ count, onClick }) {
  return (
    <button
      type="button"
      aria-label={count > 0 ? `Carrito, ${count} artículos` : 'Carrito'}
      onClick={onClick}
      className="relative text-secondary transition-colors hover:text-primary-dark"
    >
      <ShoppingCart className="h-6 w-6" />
      {count > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-dark px-1 text-[10px] font-bold text-white">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  );
}

const navLinks = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/catalogo', label: 'Catálogo' },
  { to: '/servicios', label: 'Servicios' },
  { to: '/contacto', label: 'Contacto' },
];

function navLinkClass({ isActive }) {
  return `text-sm font-semibold uppercase tracking-wide transition-colors ${
    isActive ? 'text-primary-dark' : 'text-secondary hover:text-primary-dark'
  }`;
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { count, openCart } = useCart();

  return (
    <header className="sticky top-0 z-50 border-b border-secondary/10 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <Logo />
          <span className="text-lg font-bold uppercase tracking-widest text-secondary">
            Autocells
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} className={navLinkClass}>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <CartButton count={count} onClick={openCart} />
          <Link
            to="/login"
            className="rounded-card bg-primary-dark px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            Iniciar sesión
          </Link>
        </div>

        <button
          type="button"
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          className="text-secondary md:hidden"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {menuOpen && (
        <nav className="flex flex-col gap-1 border-t border-secondary/10 bg-white px-4 py-3 md:hidden">
          {navLinks.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `rounded-card px-3 py-2 text-sm font-semibold uppercase tracking-wide ${
                  isActive ? 'bg-primary/10 text-primary-dark' : 'text-secondary'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
          <div className="mt-2 flex items-center justify-between border-t border-secondary/10 pt-3">
            <CartButton
              count={count}
              onClick={() => {
                setMenuOpen(false);
                openCart();
              }}
            />
            <Link
              to="/login"
              onClick={() => setMenuOpen(false)}
              className="rounded-card bg-primary-dark px-4 py-2 text-sm font-semibold text-white"
            >
              Iniciar sesión
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
