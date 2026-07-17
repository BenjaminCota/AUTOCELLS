import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import {
  CircleUserRound,
  CalendarClock,
  ShoppingBag,
  Save,
  LoaderCircle,
  Smartphone,
} from 'lucide-react';
import FormField from '../components/FormField';
import Badge from '../components/Badge';
import ConfirmDialog from '../components/ConfirmDialog';
import { priceFormatter } from '../components/ProductCard';
import { useToast } from '../context/ToastContext';
import { isAuthenticated, isAdmin, getCurrentUser, login } from '../routes/auth';
import { findUserByEmail, updateUser } from '../data/users';
import { LIMITS, validatePersonName, validatePhone } from '../lib/validation';
import { getAppointments } from '../data/appointments';
import { getWebOrders, updateWebOrderStatus } from '../data/orders';

export default function Account() {
  const location = useLocation();
  const toast = useToast();
  const user = getCurrentUser();

  const [form, setForm] = useState(() => ({ name: user?.name ?? '', phone: '' }));
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [pendingCancel, setPendingCancel] = useState(null);

  // Perfil, compras y citas se cargan de la base de datos. Las citas se ligan
  // por correo (agendadas con sesión) o por el teléfono de la cuenta (por si
  // agendó sin iniciar sesión).
  useEffect(() => {
    if (!user || isAdmin()) return;
    let active = true;
    (async () => {
      try {
        const account = await findUserByEmail(user.email);
        const [userOrders, userAppointments] = await Promise.all([
          getWebOrders(user.email),
          // El server regresa las citas de la sesión (correo o teléfono de la
          // cuenta); ya no se le pasan filtros desde aquí.
          getAppointments(),
        ]);
        if (!active) return;
        if (account?.phone) setForm((prev) => ({ ...prev, phone: account.phone }));
        setOrders(userOrders);
        setAppointments(userAppointments);
      } catch {
        if (active) toast.error('No se pudo cargar tu información. Recarga la página.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  // El admin demo no tiene perfil registrado: su "cuenta" es el panel.
  if (isAdmin()) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  }

  async function handleSave(event) {
    event.preventDefault();
    if (saving) return;

    // Reglas compartidas con el server (lib/validation.js).
    const errors = {};
    const nameError = validatePersonName(form.name);
    if (nameError) errors.name = nameError;
    const phoneError = validatePhone(form.phone);
    if (phoneError) errors.phone = phoneError;
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSaving(true);
    try {
      await updateUser(user.email, { name: form.name.trim(), phone: form.phone.replace(/\D/g, '') });
      // La sesión guarda nombre y teléfono (saludo del Header, prellenado de
      // la cita en Servicios): mantenerla en sync.
      login({ ...user, name: form.name.trim(), phone: form.phone.replace(/\D/g, '') });
      toast.success('Tus datos se actualizaron.');
    } catch {
      toast.error('No se pudieron guardar tus datos. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  async function handleCancelOrder() {
    try {
      await updateWebOrderStatus(pendingCancel.id, 'cancelado');
      setOrders((prev) =>
        prev.map((order) =>
          order.id === pendingCancel.id ? { ...order, status: 'cancelado' } : order,
        ),
      );
      toast.info(`Tu pedido ${pendingCancel.id} fue cancelado.`);
    } catch {
      toast.error('No se pudo cancelar el pedido. Inténtalo de nuevo.');
    } finally {
      setPendingCancel(null);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-secondary sm:text-4xl">Mi cuenta</h1>
      <p className="mt-2 text-muted">
        Hola, {user.name.split(' ')[0]}. Aquí puedes actualizar tus datos y dar seguimiento a tus
        citas y compras.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[380px_minmax(0,1fr)]">
        {/* Datos del perfil */}
        <form
          onSubmit={handleSave}
          noValidate
          className="flex h-fit flex-col gap-4 rounded-card border border-secondary/10 bg-white p-6"
        >
          <h2 className="flex items-center gap-2 text-xl font-bold text-secondary">
            <CircleUserRound className="h-5 w-5 text-primary-dark" />
            Tus datos
          </h2>
          <FormField
            label="Nombre completo"
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            maxLength={LIMITS.name.max}
            error={fieldErrors.name}
            value={form.name}
            onChange={handleChange}
            placeholder="Nombre y apellido"
          />
          <FormField
            label="Teléfono"
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            maxLength={14}
            error={fieldErrors.phone}
            value={form.phone}
            onChange={handleChange}
            placeholder="653 000 0000"
          />
          {/* El correo identifica la cuenta: no es editable. */}
          <FormField label="Correo" id="email" name="email" type="email" value={user.email} disabled />
          <button
            type="submit"
            disabled={saving}
            className="mt-2 flex items-center justify-center gap-2 rounded-card bg-primary-dark px-6 py-3 text-sm font-semibold text-white transition-colors enabled:hover:bg-primary-hover disabled:opacity-70"
          >
            {saving ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Guardando…
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Guardar cambios
              </>
            )}
          </button>
          <Link
            to="/recuperar"
            className="text-center text-sm font-medium text-primary-dark hover:underline"
          >
            ¿Quieres cambiar tu contraseña?
          </Link>
        </form>

        <div className="flex flex-col gap-8">
          {/* Citas */}
          <section className="rounded-card border border-secondary/10 bg-white p-6">
            <h2 className="flex items-center gap-2 text-xl font-bold text-secondary">
              <CalendarClock className="h-5 w-5 text-primary-dark" />
              Tus citas
            </h2>
            {loading ? (
              <p className="mt-4 flex items-center gap-2 text-sm text-muted">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Cargando tus citas…
              </p>
            ) : appointments.length > 0 ? (
              <ul className="mt-4 divide-y divide-secondary/10">
                {appointments.map((appointment) => (
                  <li key={appointment.id} className="flex flex-wrap items-center gap-3 py-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Smartphone className="h-5 w-5 text-primary-dark" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-secondary">{appointment.serviceName}</p>
                      <p className="text-sm text-muted">
                        {appointment.device ? `${appointment.device} · ` : ''}
                        {appointment.date} a las {appointment.time}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <Badge variant={appointment.status}>{appointment.status}</Badge>
                      <p className="text-sm font-bold text-secondary">
                        {priceFormatter.format(appointment.servicePrice)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted">
                No tienes citas agendadas.{' '}
                <Link to="/servicios" className="font-medium text-primary-dark hover:underline">
                  Agenda una en Servicios
                </Link>
                .
              </p>
            )}
          </section>

          {/* Compras */}
          <section className="rounded-card border border-secondary/10 bg-white p-6">
            <h2 className="flex items-center gap-2 text-xl font-bold text-secondary">
              <ShoppingBag className="h-5 w-5 text-primary-dark" />
              Tus compras
            </h2>
            {loading ? (
              <p className="mt-4 flex items-center gap-2 text-sm text-muted">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Cargando tus compras…
              </p>
            ) : orders.length > 0 ? (
              <ul className="mt-4 flex flex-col gap-4">
                {orders.map((order) => (
                  <li key={order.id} className="rounded-card border border-secondary/10 bg-bg-alt p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                          Folio
                        </p>
                        <p className="text-lg font-bold tracking-widest text-primary-dark">
                          {order.id}
                        </p>
                      </div>
                      <Badge variant={order.status}>{order.status}</Badge>
                    </div>
                    <p className="mt-3 text-sm text-secondary">{order.products}</p>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-secondary/10 pt-3">
                      <p className="text-sm text-muted">{order.date}</p>
                      <p className="font-bold text-secondary">{priceFormatter.format(order.total)}</p>
                    </div>
                    {order.status === 'pendiente' && (
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="text-xs text-muted">
                          Preséntalo en tienda para pagar en efectivo.
                        </p>
                        <button
                          type="button"
                          onClick={() => setPendingCancel(order)}
                          className="rounded-card border border-danger-dark/30 px-3 py-1.5 text-xs font-semibold text-danger-dark transition-colors hover:bg-danger/10"
                        >
                          Cancelar compra
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted">
                Aún no tienes compras.{' '}
                <Link to="/catalogo" className="font-medium text-primary-dark hover:underline">
                  Explora el catálogo
                </Link>
                .
              </p>
            )}
          </section>
        </div>
      </div>

      {pendingCancel && (
        <ConfirmDialog
          title="Cancelar compra"
          confirmLabel="Cancelar compra"
          cancelLabel="Volver"
          danger
          onConfirm={handleCancelOrder}
          onCancel={() => setPendingCancel(null)}
        >
          <p>
            ¿Cancelar el pedido <span className="font-semibold">{pendingCancel.id}</span>? Si
            cambias de opinión tendrás que hacer la compra de nuevo.
          </p>
        </ConfirmDialog>
      )}
    </div>
  );
}
