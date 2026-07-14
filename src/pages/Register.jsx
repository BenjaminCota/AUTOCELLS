import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, ShieldCheck, ArrowLeft, LoaderCircle } from 'lucide-react';
import logoFull from '../assets/logo-full.png';
import FormField from '../components/FormField';
import Alert from '../components/Alert';
import { isAuthenticated, isAdmin, login } from '../routes/auth';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import {
  EMAIL_PATTERN,
  PHONE_PATTERN,
  findUserByEmail,
  registerUser,
  generateVerificationCode,
} from '../data/users';

const emptyForm = { name: '', email: '', phone: '', password: '', confirm: '' };

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const { openCart } = useCart();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  // step: 'data' (formulario) → 'verify' (código simulado por correo).
  const [step, setStep] = useState('data');
  const [expectedCode, setExpectedCode] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');

  if (isAuthenticated()) {
    return <Navigate to={isAdmin() ? '/admin/dashboard' : '/'} replace />;
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    const email = form.email.trim().toLowerCase();
    const errors = {};
    if (!form.name.trim()) errors.name = 'Cuéntanos cómo te llamas.';
    if (!EMAIL_PATTERN.test(email)) {
      errors.email = 'Ingresa un correo válido (ej. tu@correo.com).';
    }
    if (!PHONE_PATTERN.test(form.phone.replace(/\D/g, ''))) {
      errors.phone = 'Ingresa un teléfono a 10 dígitos, sin espacios ni guiones.';
    }
    if (form.password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres.';
    }
    if (form.confirm !== form.password) {
      errors.confirm = 'Las contraseñas no coinciden.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Revisa los campos marcados para continuar.');
      return;
    }

    setSubmitting(true);
    try {
      // La unicidad del correo se consulta en la base de datos.
      if (await findUserByEmail(email)) {
        setFieldErrors({ email: 'Ese correo ya tiene una cuenta. ¿Quieres iniciar sesión?' });
        setError('Revisa los campos marcados para continuar.');
        return;
      }
      setExpectedCode(generateVerificationCode());
      setCodeInput('');
      setCodeError('');
      setStep('verify');
      toast.info('Te enviamos un código de verificación a tu correo.');
    } catch {
      toast.error('No se pudo conectar con el servidor. Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerify(event) {
    event.preventDefault();
    if (submitting) return;

    if (codeInput.trim() !== expectedCode) {
      setCodeError('El código no coincide. Revísalo e inténtalo de nuevo.');
      return;
    }

    setSubmitting(true);
    try {
      const user = await registerUser(form);
      login({ name: user.name, email: user.email, role: 'user' });
      toast.success(`¡Cuenta creada! Bienvenido, ${user.name.split(' ')[0]}.`);
      // Si venía de intentar pagar el carrito, se reabre al volver.
      if (location.state?.reopenCart) openCart();
      navigate(location.state?.from?.pathname ?? '/', { replace: true });
    } catch {
      toast.error('No se pudo crear la cuenta. Inténtalo de nuevo.');
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-bg-alt px-4 py-16">
      <div className="w-full max-w-md rounded-card border border-secondary/10 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center gap-2 text-center">
          <img src={logoFull} alt="AUTOCELLS" className="h-20 w-auto" />
          <h1 className="mt-2 text-2xl font-bold text-secondary">
            {step === 'data' ? 'Crear cuenta' : 'Verifica tu correo'}
          </h1>
          <p className="text-sm text-muted">
            {step === 'data'
              ? 'Regístrate para hacer pedidos y dar seguimiento a tus compras.'
              : `Escribe el código que enviamos a ${form.email.trim().toLowerCase()}.`}
          </p>
        </div>

        {step === 'data' ? (
          <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-4">
            {error && <Alert variant="error">{error}</Alert>}
            <FormField
              label="Nombre"
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              error={fieldErrors.name}
              value={form.name}
              onChange={handleChange}
              placeholder="Tu nombre"
            />
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
              label="Teléfono"
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              error={fieldErrors.phone}
              value={form.phone}
              onChange={handleChange}
              placeholder="653 000 0000"
            />
            <FormField
              label="Contraseña"
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              error={fieldErrors.password}
              value={form.password}
              onChange={handleChange}
              placeholder="Mínimo 6 caracteres"
            />
            <FormField
              label="Confirmar contraseña"
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              error={fieldErrors.confirm}
              value={form.confirm}
              onChange={handleChange}
              placeholder="Repite tu contraseña"
            />

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 flex items-center justify-center gap-2 rounded-card bg-primary-dark px-6 py-3 text-sm font-semibold text-white transition-colors enabled:hover:bg-primary-hover disabled:opacity-70"
            >
              {submitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Verificando…
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Crear cuenta
                </>
              )}
            </button>

            <p className="text-center text-sm text-muted">
              ¿Ya tienes cuenta?{' '}
              <Link
                to="/login"
                state={location.state}
                className="font-semibold text-primary-dark hover:underline"
              >
                Inicia sesión
              </Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerify} noValidate className="mt-6 flex flex-col gap-4">
            {/* Simulación del correo: sin backend, el código se muestra aquí
                mismo. Con backend real este recuadro desaparece. */}
            <div className="rounded-card border border-primary-dark/20 bg-primary/5 p-4 text-center">
              <p className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary-dark">
                <Mail className="h-4 w-4" />
                Correo simulado (demo sin backend)
              </p>
              <p className="mt-2 text-sm text-secondary">Tu código de verificación es:</p>
              <p className="mt-1 text-3xl font-bold tracking-[0.3em] text-secondary">
                {expectedCode}
              </p>
            </div>

            <FormField
              label="Código de verificación"
              id="code"
              name="code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              error={codeError}
              value={codeInput}
              onChange={(event) => {
                setCodeInput(event.target.value);
                setCodeError('');
              }}
              placeholder="000000"
            />

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 flex items-center justify-center gap-2 rounded-card bg-primary-dark px-6 py-3 text-sm font-semibold text-white transition-colors enabled:hover:bg-primary-hover disabled:opacity-70"
            >
              {submitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Creando cuenta…
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Confirmar cuenta
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setStep('data')}
              className="flex items-center justify-center gap-1 text-sm font-medium text-muted transition-colors hover:text-primary-dark"
            >
              <ArrowLeft className="h-4 w-4" />
              Corregir mis datos
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
