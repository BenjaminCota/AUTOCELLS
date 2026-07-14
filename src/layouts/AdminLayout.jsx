import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ClipboardList, Wrench, LogOut, Menu, X } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';
import Logo from '../components/Logo';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../context/ToastContext';
import { logout } from '../routes/auth';

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/productos', label: 'Productos', icon: Package },
  { to: '/admin/pedidos', label: 'Pedidos', icon: ClipboardList },
  { to: '/admin/servicios', label: 'Servicios', icon: Wrench },
];

export default function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  function handleLogout() {
    logout();
    setConfirmingLogout(false);
    toast.info('Cerraste sesión del panel de administración.');
    navigate('/login');
  }

  return (
    <div className="flex min-h-screen bg-bg-alt">
      <aside className="hidden w-64 flex-col bg-secondary text-white md:flex">
        <SidebarContent onLogout={() => setConfirmingLogout(true)} />
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
          <aside className="relative flex h-full w-64 flex-col bg-secondary text-white">
            <button
              type="button"
              aria-label="Cerrar menú"
              className="absolute right-3 top-3 text-white/80"
              onClick={() => setMenuOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent
              onLogout={() => setConfirmingLogout(true)}
              onNavigate={() => setMenuOpen(false)}
            />
          </aside>
        </div>
      )}

      <div className="flex flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-secondary/10 bg-white px-4 py-3 md:hidden">
          <button type="button" aria-label="Abrir menú" onClick={() => setMenuOpen(true)}>
            <Menu className="h-6 w-6 text-secondary" />
          </button>
          <Logo />
          <span className="font-bold uppercase tracking-widest text-secondary">Admin</span>
        </header>
        <Breadcrumb />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {confirmingLogout && (
        <ConfirmDialog
          title="Cerrar sesión"
          confirmLabel="Cerrar sesión"
          onConfirm={handleLogout}
          onCancel={() => setConfirmingLogout(false)}
        >
          <p>¿Seguro que deseas cerrar sesión del panel de administración?</p>
        </ConfirmDialog>
      )}
    </div>
  );
}

function SidebarContent({ onLogout, onNavigate }) {
  return (
    <>
      <div className="flex items-center gap-3 px-6 py-6">
        <Logo />
        <span className="text-lg font-bold uppercase tracking-widest">Autocells</span>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-card px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? 'bg-primary-dark text-white' : 'text-white/80 hover:bg-white/10'
              }`
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>
      <button
        type="button"
        onClick={onLogout}
        className="m-3 flex items-center gap-3 rounded-card px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10"
      >
        <LogOut className="h-5 w-5" />
        Cerrar sesión
      </button>
    </>
  );
}
