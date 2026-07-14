import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Menu, X, ShoppingCart, CircleUserRound, LogOut } from 'lucide-react';
import Logo from './Logo';
import ConfirmDialog from './ConfirmDialog';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { getCurrentUser, logout } from '../routes/auth';

// Saludo + botón de salir cuando hay sesión; botón de login cuando no.
// El Header se re-renderiza en cada navegación (MainLayout usa useLocation),
// así que leer la sesión de localStorage en render es suficiente.
function AccountActions({ onNavigate }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const user = getCurrentUser();

  function handleLogout() {
    logout();
    setConfirmingLogout(false);
    onNavigate?.();
    toast.info('Cerraste sesión. ¡Vuelve pronto!');
    navigate('/');
  }

  if (!user) {
    return (
      <Link
        to="/login"
        onClick={onNavigate}
        className="rounded-card bg-primary-dark px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
      >
        Iniciar sesión
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* El nombre lleva a Mi cuenta (o al panel, si es admin). */}
      <Link
        to={user.role === 'admin' ? '/admin/dashboard' : '/cuenta'}
        onClick={onNavigate}
        className="flex items-center gap-1.5 text-sm font-semibold text-secondary transition-colors hover:text-primary-dark"
      >
        <CircleUserRound className="h-5 w-5 text-primary-dark" />
        {user.name.split(' ')[0]}
      </Link>
      <button
        type="button"
        onClick={() => setConfirmingLogout(true)}
        aria-label="Cerrar sesión"
        className="flex items-center gap-1 rounded-card border border-secondary/20 px-3 py-2 text-sm font-semibold text-secondary transition-colors hover:border-primary-dark hover:text-primary-dark"
      >
        <LogOut className="h-4 w-4" />
        Salir
      </button>

      {confirmingLogout && (
        <ConfirmDialog
          title="Cerrar sesión"
          confirmLabel="Cerrar sesión"
          onConfirm={handleLogout}
          onCancel={() => setConfirmingLogout(false)}
        >
          <p>¿Seguro que deseas cerrar sesión?</p>
        </ConfirmDialog>
      )}
    </div>
  );
}

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
          <AccountActions />
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
            <AccountActions onNavigate={() => setMenuOpen(false)} />
          </div>
        </nav>
      )}
    </header>
  );
}
