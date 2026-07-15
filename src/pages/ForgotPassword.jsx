import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Mail, ShieldCheck, KeyRound, CheckCircle2, ArrowLeft } from 'lucide-react';
import logoFull from '../assets/logo-full.png';
import FormField from '../components/FormField';
import Alert from '../components/Alert';
import { useToast } from '../context/ToastContext';
import { requestPasswordReset, validateResetCode, resetPassword } from '../data/users';
import { LIMITS, validateEmail, validatePassword } from '../lib/validation';

const stepCopy = {
  email: {
    title: 'Recuperar contraseña',
    subtitle: 'Escribe el correo con el que te registraste.',
  },
  verify: {
    title: 'Revisa tu correo',
    subtitle: 'Te enviamos un código de 6 dígitos. Vence en 30 minutos.',
  },
  reset: {
    title: 'Nueva contraseña',
    subtitle: 'Elige una contraseña nueva para tu cuenta.',
  },
  done: {
    title: '¡Contraseña actualizada!',
    subtitle: 'Ya puedes iniciar sesión con tu nueva contraseña.',
  },
};

export default function ForgotPassword() {
  const location = useLocation();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  // Flujo: 'email' → 'verify' (código real por correo) → 'reset' → 'done'.
  // El código lo genera y valida el server (/usuarios/recuperar); aquí nunca
  // se conoce, salvo en dev sin SMTP, donde viaja como devResetCode.
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [devCode, setDevCode] = useState(null);
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [resetErrors, setResetErrors] = useState({});

  async function handleEmailSubmit(event) {
    event.preventDefault();
    if (busy) return;

    const normalized = email.trim().toLowerCase();
    const invalid = validateEmail(normalized);
    if (invalid) {
      setEmailError(invalid);
      return;
    }

    setBusy(true);
    try {
      // El server genera el código, lo guarda con vigencia de 30 minutos y lo
      // manda por correo.
      const result = await requestPasswordReset(normalized);
      setDevCode(result.devResetCode ?? null);
      setCodeInput('');
      setCodeError('');
      setStep('verify');
      toast.info('Te enviamos un código de recuperación a tu correo.');
    } catch (requestError) {
      if (requestError.status === 404) {
        setEmailError('No encontramos una cuenta con ese correo.');
      } else {
        toast.error(requestError.message ?? 'No se pudo conectar con el servidor. Inténtalo de nuevo.');
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify(event) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    try {
      // El código se confirma con el server antes de pedir la contraseña
      // nueva (los intentos fallidos cuentan: máximo 5 por código).
      await validateResetCode(email.trim().toLowerCase(), codeInput.trim());
      setStep('reset');
    } catch (requestError) {
      setCodeError(requestError.message ?? 'No se pudo validar el código.');
    } finally {
      setBusy(false);
    }
  }

  async function handleReset(event) {
    event.preventDefault();
    if (busy) return;

    // Mismas reglas que el registro (lib/validation.js, compartidas con el server).
    const errors = {};
    const passwordError = validatePassword(password);
    if (passwordError) errors.password = passwordError;
    if (confirm !== password) {
      errors.confirm = 'Las contraseñas no coinciden.';
    }
    if (Object.keys(errors).length > 0) {
      setResetErrors(errors);
      return;
    }

    setBusy(true);
    try {
      // El server vuelve a validar el código junto con la contraseña nueva
      // (por si venció entre un paso y otro) y cierra las sesiones abiertas.
      await resetPassword(email.trim().toLowerCase(), codeInput.trim(), password);
      setStep('done');
      toast.success('Tu contraseña se actualizó correctamente.');
    } catch (requestError) {
      toast.error(requestError.message ?? 'No se pudo actualizar la contraseña. Inténtalo de nuevo.');
      // 410 = el código venció o se agotaron los intentos: hay que pedir otro.
      if (requestError.status === 410) setStep('email');
    } finally {
      setBusy(false);
    }
  }

  const copy = stepCopy[step];

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-bg-alt px-4 py-16">
      <div className="w-full max-w-md rounded-card border border-secondary/10 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center gap-2 text-center">
          <img src={logoFull} alt="AUTOCELLS" className="h-20 w-auto" />
          <h1 className="mt-2 text-2xl font-bold text-secondary">{copy.title}</h1>
          <p className="text-sm text-muted">{copy.subtitle}</p>
        </div>

        {step === 'email' && (
          <form onSubmit={handleEmailSubmit} noValidate className="mt-6 flex flex-col gap-4">
            <FormField
              label="Correo"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              error={emailError}
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setEmailError('');
              }}
              placeholder="tu@correo.com"
            />
            <button
              type="submit"
              disabled={busy}
              className="mt-2 flex items-center justify-center gap-2 rounded-card bg-primary-dark px-6 py-3 text-sm font-semibold text-white transition-colors enabled:hover:bg-primary-hover disabled:opacity-70"
            >
              <Mail className="h-4 w-4" />
              {busy ? 'Buscando cuenta…' : 'Enviar código'}
            </button>
            <Link
              to="/login"
              state={location.state}
              className="flex items-center justify-center gap-1 text-sm font-medium text-muted transition-colors hover:text-primary-dark"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a iniciar sesión
            </Link>
          </form>
        )}

        {step === 'verify' && (
          <form onSubmit={handleVerify} noValidate className="mt-6 flex flex-col gap-4">
            {/* Solo en dev sin SMTP: el server regresa el código para poder
                probar el flujo (en producción con correo real nunca viaja). */}
            {devCode && (
              <div className="rounded-card border border-primary-dark/20 bg-primary/5 p-4 text-center">
                <p className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary-dark">
                  <Mail className="h-4 w-4" />
                  Correo simulado (sin SMTP configurado)
                </p>
                <p className="mt-2 text-sm text-secondary">Tu código de recuperación es:</p>
                <p className="mt-1 text-3xl font-bold tracking-[0.3em] text-secondary">{devCode}</p>
              </div>
            )}
            <FormField
              label="Código de recuperación"
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
              disabled={busy}
              className="mt-2 flex items-center justify-center gap-2 rounded-card bg-primary-dark px-6 py-3 text-sm font-semibold text-white transition-colors enabled:hover:bg-primary-hover disabled:opacity-70"
            >
              <ShieldCheck className="h-4 w-4" />
              {busy ? 'Verificando…' : 'Verificar código'}
            </button>
            <button
              type="button"
              onClick={() => setStep('email')}
              className="text-sm font-medium text-muted transition-colors hover:text-primary-dark"
            >
              ¿No te llegó? Pedir un código nuevo
            </button>
          </form>
        )}

        {step === 'reset' && (
          <form onSubmit={handleReset} noValidate className="mt-6 flex flex-col gap-4">
            <FormField
              label="Nueva contraseña"
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              maxLength={LIMITS.password.max}
              error={resetErrors.password}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setResetErrors((prev) => ({ ...prev, password: '' }));
              }}
              placeholder="Mínimo 6 caracteres, letras y números"
            />
            <FormField
              label="Confirmar contraseña"
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              error={resetErrors.confirm}
              value={confirm}
              onChange={(event) => {
                setConfirm(event.target.value);
                setResetErrors((prev) => ({ ...prev, confirm: '' }));
              }}
              placeholder="Repite tu contraseña"
            />
            <button
              type="submit"
              disabled={busy}
              className="mt-2 flex items-center justify-center gap-2 rounded-card bg-primary-dark px-6 py-3 text-sm font-semibold text-white transition-colors enabled:hover:bg-primary-hover disabled:opacity-70"
            >
              <KeyRound className="h-4 w-4" />
              {busy ? 'Guardando…' : 'Guardar contraseña'}
            </button>
          </form>
        )}

        {step === 'done' && (
          <div className="mt-6 flex flex-col items-center gap-4 text-center">
            <CheckCircle2 className="h-12 w-12 text-success-dark" />
            <Alert variant="success">Tu contraseña se actualizó correctamente.</Alert>
            <Link
              to="/login"
              state={location.state}
              className="flex w-full items-center justify-center gap-2 rounded-card bg-primary-dark px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              Iniciar sesión
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
