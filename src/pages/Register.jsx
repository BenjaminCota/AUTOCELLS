import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { UserPlus, Mail, MailCheck, ArrowLeft, LoaderCircle } from 'lucide-react';
import logoFull from '../assets/logo-full.png';
import FormField from '../components/FormField';
import Alert from '../components/Alert';
import { isAuthenticated, isAdmin } from '../routes/auth';
import { useToast } from '../context/ToastContext';
import { registerUser, resendVerification } from '../data/users';
import {
  LIMITS,
  validatePersonName,
  validateEmail,
  validatePhone,
  validatePassword,
} from '../lib/validation';

const emptyForm = { name: '', email: '', phone: '', password: '', confirm: '' };

export default function Register() {
  const location = useLocation();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  // step: 'data' (formulario) → 'sent' (la cuenta quedó pendiente y el enlace
  // de verificación viajó por correo; ver server/mailer.js).
  const [step, setStep] = useState('data');
  // Sin SMTP configurado (dev) el server regresa el enlace para mostrarlo aquí.
  const [sentInfo, setSentInfo] = useState({ mailSent: false, devVerifyUrl: null });

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
    // Los validadores compartidos (lib/validation.js) regresan el mensaje o
    // null; el server aplica exactamente las mismas reglas.
    const errors = {};
    const nameError = validatePersonName(form.name);
    if (nameError) errors.name = nameError;
    const emailError = validateEmail(email);
    if (emailError) errors.email = emailError;
    const phoneError = validatePhone(form.phone);
    if (phoneError) errors.phone = phoneError;
    const passwordError = validatePassword(form.password);
    if (passwordError) errors.password = passwordError;
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
      // La cuenta se crea pendiente de verificar; no hay sesión hasta que el
      // usuario confirme su correo e inicie sesión.
      const created = await registerUser(form);
      setSentInfo({ mailSent: Boolean(created.mailSent), devVerifyUrl: created.devVerifyUrl ?? null });
      setStep('sent');
    } catch (requestError) {
      if (requestError.status === 409) {
        setFieldErrors({ email: 'Ese correo ya tiene una cuenta. ¿Quieres iniciar sesión?' });
        setError('Revisa los campos marcados para continuar.');
      } else if (requestError.status === 400 || requestError.status === 429) {
        setError(requestError.message);
      } else {
        toast.error('No se pudo conectar con el servidor. Inténtalo de nuevo.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    if (submitting) return;
    setSubmitting(true);
    try {
      const result = await resendVerification(form.email.trim().toLowerCase());
      setSentInfo({ mailSent: Boolean(result.mailSent), devVerifyUrl: result.devVerifyUrl ?? null });
      toast.info('Te reenviamos el correo de verificación.');
    } catch (resendError) {
      // 429 = límite de reenvíos: el mensaje del server pide esperar.
      toast.error(
        resendError.status === 429 ? resendError.message : 'No se pudo reenviar el correo. Inténtalo de nuevo.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-bg-alt px-4 py-16">
      <div className="w-full max-w-md rounded-card border border-secondary/10 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center gap-2 text-center">
          <img src={logoFull} alt="AUTOCELLS" className="h-20 w-auto" />
          <h1 className="mt-2 text-2xl font-bold text-secondary">
            {step === 'data' ? 'Crear cuenta' : 'Revisa tu correo'}
          </h1>
          <p className="text-sm text-muted">
            {step === 'data'
              ? 'Regístrate para hacer pedidos y dar seguimiento a tus compras.'
              : `Te enviamos un enlace de verificación a ${form.email.trim().toLowerCase()}.`}
          </p>
        </div>

        {step === 'data' ? (
          <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-4">
            {error && <Alert variant="error">{error}</Alert>}
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
              label="Contraseña"
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              maxLength={LIMITS.password.max}
              error={fieldErrors.password}
              value={form.password}
              onChange={handleChange}
              placeholder="Mínimo 6 caracteres, letras y números"
            />
            <FormField
              label="Confirmar contraseña"
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              maxLength={LIMITS.password.max}
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
                  Creando cuenta…
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
          <div className="mt-6 flex flex-col gap-4">
            <div className="flex flex-col items-center gap-3 rounded-card border border-secondary/10 bg-bg-alt p-6 text-center">
              <MailCheck className="h-10 w-10 text-primary-dark" strokeWidth={1.5} />
              <p className="text-sm text-secondary">
                Tu cuenta quedó <strong>pendiente de verificar</strong>. Abre el enlace del correo
                para activarla; vence en 24 horas.
              </p>
              <p className="text-xs text-muted">
                Hasta que verifiques tu correo no podrás realizar compras.
              </p>
            </div>

            {sentInfo.devVerifyUrl && (
              /* Sin SMTP configurado (dev), el server regresa el enlace para
                 probarlo aquí mismo. Con SMTP real este recuadro no aparece. */
              <div className="rounded-card border border-primary-dark/20 bg-primary/5 p-4 text-center">
                <p className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary-dark">
                  <Mail className="h-4 w-4" />
                  Correo simulado (SMTP sin configurar)
                </p>
                <a
                  href={sentInfo.devVerifyUrl}
                  className="mt-2 inline-block break-all text-sm font-semibold text-primary-dark hover:underline"
                >
                  Abrir enlace de verificación
                </a>
              </div>
            )}

            {!sentInfo.mailSent && !sentInfo.devVerifyUrl && (
              <Alert variant="error">
                No pudimos enviar el correo. Usa «Reenviar correo» para intentarlo de nuevo.
              </Alert>
            )}

            <button
              type="button"
              onClick={handleResend}
              disabled={submitting}
              className="flex items-center justify-center gap-2 rounded-card border border-secondary/20 px-6 py-3 text-sm font-semibold text-secondary transition-colors enabled:hover:border-primary-dark enabled:hover:text-primary-dark disabled:opacity-70"
            >
              {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              Reenviar correo
            </button>

            <Link
              to="/login"
              state={location.state}
              className="flex items-center justify-center gap-2 rounded-card bg-primary-dark px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              Ir a iniciar sesión
            </Link>

            <button
              type="button"
              onClick={() => setStep('data')}
              className="flex items-center justify-center gap-1 text-sm font-medium text-muted transition-colors hover:text-primary-dark"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al formulario
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
