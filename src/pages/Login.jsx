import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LogIn, LoaderCircle } from 'lucide-react';
import logoFull from '../assets/logo-full.png';
import FormField from '../components/FormField';
import Alert from '../components/Alert';
import { isAuthenticated, isAdmin, login } from '../routes/auth';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { validateCredentials } from '../data/users';
import { validateEmail } from '../lib/validation';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { openCart } = useCart();
  const toast = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated()) {
    return <Navigate to={isAdmin() ? '/admin/dashboard' : '/'} replace />;
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  }

  function finishLogin(user) {
    login(user);
    toast.success(`¡Bienvenido, ${user.name.split(' ')[0]}!`);
    const from = location.state?.from?.pathname;
    if (user.role === 'admin') {
      navigate(from ?? '/admin/dashboard', { replace: true });
      return;
    }
    // Si venía de intentar pagar el carrito, se reabre al volver. Un usuario
    // normal nunca debe aterrizar en /admin (rebotaría de vuelta al login).
    if (location.state?.reopenCart) openCart();
    const target = from && !from.startsWith('/admin') ? from : '/';
    navigate(target, { replace: true });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    const email = form.email.trim().toLowerCase();
    if (!email || !form.password) {
      setError('Completa tu correo y contraseña para continuar.');
      setFieldErrors({
        email: email ? '' : 'Ingresa tu correo.',
        password: form.password ? '' : 'Ingresa tu contraseña.',
      });
      return;
    }

    // Solo formato del correo: aquí no aplican reglas de fuerza de contraseña
    // (las cuentas se validan contra la base, no contra las reglas de registro).
    const emailError = validateEmail(email);
    if (emailError) {
      setError('Revisa tu correo para continuar.');
      setFieldErrors({ email: emailError, password: '' });
      return;
    }

    setSubmitting(true);
    try {
      const result = await validateCredentials(email, form.password);
      if (!result.ok) {
        if (result.reason === 'email') {
          setError('No encontramos una cuenta con ese correo.');
          setFieldErrors({ email: 'Correo no registrado.', password: '' });
        } else {
          setError('La contraseña es incorrecta.');
          setFieldErrors({ email: '', password: 'Contraseña incorrecta.' });
        }
        return;
      }
      // Iniciar sesión sin verificar sí se permite; lo que se bloquea es la
      // compra (Checkout y el server lo rechazan). Se avisa desde aquí.
      if (!result.user.verified) {
        toast.info('Tu cuenta aún no está verificada: revisa tu correo para poder comprar.');
      }
      // La sesión guarda el token que autoriza el API y el rol/teléfono que
      // regresa el server (el admin ya es una cuenta real de la base, creada
      // con server/create-admin.js — no hay credenciales demo en el código).
      finishLogin({
        token: result.token,
        name: result.user.name,
        email: result.user.email,
        phone: result.user.phone,
        role: result.user.role ?? 'user',
      });
    } catch {
      toast.error('No se pudo conectar con el servidor. Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-bg-alt px-4 py-16">
      <div className="w-full max-w-md rounded-card border border-secondary/10 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center gap-2 text-center">
          <img src={logoFull} alt="AUTOCELLS" className="h-20 w-auto" />
          <h1 className="mt-2 text-2xl font-bold text-secondary">Iniciar sesión</h1>
          <p className="text-sm text-muted">Accede a tu cuenta AUTOCELLS</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-4">
          <FormField
            label="Correo"
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            error={fieldErrors.email}
            value={form.email}
            onChange={handleChange}
            placeholder="tu@correo.com"
          />
          <FormField
            label="Contraseña"
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            error={fieldErrors.password}
            value={form.password}
            onChange={handleChange}
            placeholder="••••••••"
          />

          {error && <Alert variant="error">{error}</Alert>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 flex items-center justify-center gap-2 rounded-card bg-primary-dark px-6 py-3 text-sm font-semibold text-white transition-colors enabled:hover:bg-primary-hover disabled:opacity-70"
          >
            {submitting ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Iniciando sesión…
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                Iniciar sesión
              </>
            )}
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-2 text-center text-sm">
          <p className="text-muted">
            ¿No tienes cuenta?{' '}
            {/* Se propaga location.state para no perder el retorno al carrito. */}
            <Link
              to="/registro"
              state={location.state}
              className="font-semibold text-primary-dark hover:underline"
            >
              Regístrate
            </Link>
          </p>
          <Link
            to="/recuperar"
            state={location.state}
            className="font-medium text-primary-dark hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      </div>
    </div>
  );
}
