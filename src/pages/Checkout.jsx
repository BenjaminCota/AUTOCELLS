import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { ShoppingBag, ShoppingCart, Banknote, CheckCircle2, MapPin, LoaderCircle } from 'lucide-react';
import FormField from '../components/FormField';
import Alert from '../components/Alert';
import { priceFormatter } from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { isAuthenticated, getCurrentUser } from '../routes/auth';
import { findUserByEmail, resendVerification } from '../data/users';
import { LIMITS, validatePersonName, validateEmail, validatePhone } from '../lib/validation';
import { addWebOrder } from '../data/orders';
import { STORE_ADDRESS, STORE_HOURS } from '../data/store';

export default function Checkout() {
  const location = useLocation();
  const { items, total, clearCart } = useCart();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);

  // Autollenado desde la sesión; el teléfono no vive en ella, se consulta a
  // la base de datos en el efecto de abajo (el admin demo no tiene, queda vacío).
  const [form, setForm] = useState(() => {
    const user = getCurrentUser();
    return {
      name: user?.name ?? '',
      phone: '',
      email: user?.email ?? '',
    };
  });

  // Solo cuentas verificadas pueden comprar (el server también lo exige).
  // El admin demo no existe en la base: se trata como no verificado.
  const [verified, setVerified] = useState(true);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) return;
    findUserByEmail(user.email)
      .then((account) => {
        setVerified(Boolean(account?.verified));
        if (account?.phone) {
          setForm((prev) => (prev.phone ? prev : { ...prev, phone: account.phone }));
        }
      })
      .catch(() => {
        // Sin conexión el campo queda vacío; el usuario puede escribirlo.
      });
  }, []);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  // Pedido confirmado: se muestra el folio aunque el carrito ya esté vacío.
  const [order, setOrder] = useState(null);

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (order) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-5 px-4 py-16 text-center">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
          <CheckCircle2 className="h-8 w-8 text-success-dark" strokeWidth={1.5} />
        </span>
        <h1 className="text-3xl font-bold text-secondary">¡Pedido registrado!</h1>

        <div className="w-full rounded-card border border-secondary/10 bg-bg-alt p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Tu folio</p>
          <p className="mt-2 text-3xl font-bold tracking-widest text-primary-dark">{order.id}</p>
          <p className="mt-3 text-sm text-muted">
            Guárdalo o toma captura: lo presentas en la tienda para pagar.
          </p>
        </div>

        <Alert variant="success">
          Tu pedido quedó <strong>pendiente</strong>. Pasa a la tienda, paga en efectivo y te
          entregamos tus productos en el momento.
        </Alert>

        <div className="w-full rounded-card border border-secondary/10 p-4 text-left text-sm text-secondary">
          <p className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary-dark" />
            {STORE_ADDRESS}
          </p>
          <p className="mt-2 text-xs text-muted">{STORE_HOURS}</p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row">
          <Link
            to="/catalogo"
            className="flex-1 rounded-card bg-primary-dark px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            Seguir comprando
          </Link>
          <Link
            to="/"
            className="flex-1 rounded-card border border-secondary/20 px-5 py-2.5 text-sm font-semibold text-secondary transition-colors hover:border-primary-dark hover:text-primary-dark"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-24 text-center">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <ShoppingCart className="h-8 w-8 text-primary-dark" strokeWidth={1.5} />
        </span>
        <h1 className="text-2xl font-bold text-secondary">Tu carrito está vacío</h1>
        <p className="text-muted">Agrega productos desde el catálogo para poder comprar.</p>
        <Link
          to="/catalogo"
          className="rounded-card bg-primary-dark px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          Ver catálogo
        </Link>
      </div>
    );
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    setFormError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    // Reglas compartidas con el server (lib/validation.js).
    const errors = {};
    const nameError = validatePersonName(form.name);
    if (nameError) errors.name = nameError;
    const phoneError = validatePhone(form.phone);
    if (phoneError) errors.phone = phoneError;
    const emailError = validateEmail(form.email);
    if (emailError) errors.email = emailError;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError('Revisa los campos marcados antes de realizar la compra.');
      return;
    }

    const productsSummary = items
      .map((line) => {
        const variant = [line.storage, line.color].filter(Boolean).join(', ');
        return `${line.qty}× ${line.product.name}${variant ? ` (${variant})` : ''}`;
      })
      .join(', ');

    setSubmitting(true);
    try {
      // El folio lo genera el servidor al guardar el pedido en la base de datos.
      const newOrder = await addWebOrder({
        customer: form.name.trim(),
        phone: form.phone.replace(/\D/g, ''),
        email: form.email.trim().toLowerCase(),
        products: productsSummary,
        items: items.map((line) => ({
          // El id es el que descuenta inventario en el server (los productos
          // del catálogo estático no están en la base y no llevan stock).
          id: line.id,
          name: line.product.name,
          qty: line.qty,
          storage: line.storage,
          color: line.color,
          subtotal: line.subtotal,
        })),
        total,
      });

      setOrder(newOrder);
      clearCart();
      toast.success(`¡Pedido registrado! Tu folio es ${newOrder.id}.`);
    } catch (requestError) {
      // 403 = cuenta sin verificar (el server es la autoridad, por si esta
      // pantalla se cargó antes de verificar en otra pestaña).
      if (requestError.status === 403) {
        setVerified(false);
        setFormError(requestError.message);
      } else if (requestError.status === 409 || requestError.status === 400) {
        // 409 = inventario insuficiente (alguien compró antes): el mensaje
        // del server dice qué producto y cuántas piezas quedan.
        setFormError(requestError.message);
        toast.error('Hay productos sin inventario suficiente. Ajusta tu carrito.');
      } else if (requestError.status === 429) {
        setFormError(requestError.message);
      } else {
        toast.error('No se pudo registrar el pedido. Inténtalo de nuevo.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResendVerification() {
    if (resending) return;
    setResending(true);
    try {
      await resendVerification(form.email.trim().toLowerCase());
      toast.info('Te enviamos el correo de verificación. Revisa tu bandeja de entrada.');
    } catch (resendError) {
      // 429 = límite de reenvíos: el mensaje del server pide esperar.
      toast.error(
        resendError.status === 429 ? resendError.message : 'No se pudo enviar el correo. Inténtalo de nuevo.',
      );
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-secondary">Finalizar compra</h1>
      <p className="mt-2 max-w-prose text-muted">
        Confirma tus datos y recoge tu pedido en la tienda. El pago es en efectivo al recogerlo.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Datos del cliente */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-4 rounded-card border border-secondary/10 bg-white p-6"
        >
          <h2 className="text-xl font-bold text-secondary">Tus datos</h2>
          {!verified && (
            <Alert variant="error">
              Tu cuenta aún no está verificada: confirma tu correo para poder comprar.{' '}
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resending}
                className="font-semibold underline disabled:opacity-70"
              >
                {resending ? 'Enviando…' : 'Reenviar correo de verificación'}
              </button>
            </Alert>
          )}
          {formError && <Alert variant="error">{formError}</Alert>}

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
          <FormField
            label="Correo"
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            maxLength={LIMITS.email.max}
            error={fieldErrors.email}
            value={form.email}
            onChange={handleChange}
            placeholder="tu@correo.com"
          />

          <div className="rounded-card border border-primary-dark/20 bg-primary/5 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-primary-dark">
              <Banknote className="h-5 w-5" />
              Pago en efectivo en tienda
            </p>
            <p className="mt-1 text-sm text-secondary">
              Único método de pago disponible. Al confirmar recibirás un folio; preséntalo en la
              tienda para pagar y recoger tu pedido.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting || !verified}
            className="mt-2 flex items-center justify-center gap-2 rounded-card bg-primary-dark px-6 py-3 text-sm font-semibold text-white transition-colors enabled:hover:bg-primary-hover disabled:opacity-70"
          >
            {submitting ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Procesando compra…
              </>
            ) : (
              <>
                <ShoppingBag className="h-4 w-4" />
                {verified ? 'Realizar compra' : 'Verifica tu correo para comprar'}
              </>
            )}
          </button>
        </form>

        {/* Resumen del pedido */}
        <aside className="h-fit rounded-card border border-secondary/10 bg-bg-alt p-6">
          <h2 className="text-lg font-bold text-secondary">Tu pedido</h2>
          <ul className="mt-4 divide-y divide-secondary/10">
            {items.map((line) => {
              const variant = [line.storage, line.color].filter(Boolean).join(' · ');
              return (
                <li key={line.key} className="flex items-start justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-semibold text-secondary">
                      {line.qty}× {line.product.name}
                    </p>
                    {variant && <p className="text-xs text-muted">{variant}</p>}
                  </div>
                  <p className="text-sm font-bold text-secondary">
                    {priceFormatter.format(line.subtotal)}
                  </p>
                </li>
              );
            })}
          </ul>
          <div className="mt-2 flex items-center justify-between border-t border-secondary/10 pt-4">
            <span className="text-sm font-semibold uppercase tracking-wide text-muted">Total</span>
            <span className="text-xl font-bold text-secondary">{priceFormatter.format(total)}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
