import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Mail, ShieldCheck, KeyRound, CheckCircle2, ArrowLeft } from 'lucide-react';
import logoFull from '../assets/logo-full.png';
import FormField from '../components/FormField';
import Alert from '../components/Alert';
import { useToast } from '../context/ToastContext';
import {
  EMAIL_PATTERN,
  findUserByEmail,
  updatePassword,
  generateVerificationCode,
} from '../data/users';

const stepCopy = {
  email: {
    title: 'Recuperar contraseña',
    subtitle: 'Escribe el correo con el que te registraste.',
  },
  verify: {
    title: 'Verifica tu correo',
    subtitle: 'Escribe el código que te enviamos para continuar.',
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
  // Flujo: 'email' → 'verify' (código simulado) → 'reset' → 'done'.
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [expectedCode, setExpectedCode] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [resetErrors, setResetErrors] = useState({});

  async function handleEmailSubmit(event) {
    event.preventDefault();
    if (busy) return;

    const normalized = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(normalized)) {
      setEmailError('Ingresa un correo válido (ej. tu@correo.com).');
      return;
    }

    setBusy(true);
    try {
      // La cuenta se busca en la base de datos.
      if (!(await findUserByEmail(normalized))) {
        setEmailError('No encontramos una cuenta con ese correo.');
        return;
      }
      setExpectedCode(generateVerificationCode());
      setCodeInput('');
      setCodeError('');
      setStep('verify');
      toast.info('Te enviamos un código de recuperación a tu correo.');
    } catch {
      toast.error('No se pudo conectar con el servidor. Inténtalo de nuevo.');
    } finally {
      setBusy(false);
    }
  }

  function handleVerify(event) {
    event.preventDefault();

    if (codeInput.trim() !== expectedCode) {
      setCodeError('El código no coincide. Revísalo e inténtalo de nuevo.');
      return;
    }
    setStep('reset');
  }

  async function handleReset(event) {
    event.preventDefault();
    if (busy) return;

    const errors = {};
    if (password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres.';
    }
    if (confirm !== password) {
      errors.confirm = 'Las contraseñas no coinciden.';
    }
    if (Object.keys(errors).length > 0) {
      setResetErrors(errors);
      return;
    }

    setBusy(true);
    try {
      await updatePassword(email, password);
      setStep('done');
      toast.success('Tu contraseña se actualizó correctamente.');
    } catch {
      toast.error('No se pudo actualizar la contraseña. Inténtalo de nuevo.');
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
            {/* Simulación del correo: sin backend, el código se muestra aquí
                mismo. Con backend real este recuadro desaparece. */}
            <div className="rounded-card border border-primary-dark/20 bg-primary/5 p-4 text-center">
              <p className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary-dark">
                <Mail className="h-4 w-4" />
                Correo simulado (demo sin backend)
              </p>
              <p className="mt-2 text-sm text-secondary">Tu código de recuperación es:</p>
              <p className="mt-1 text-3xl font-bold tracking-[0.3em] text-secondary">
                {expectedCode}
              </p>
            </div>
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
              className="mt-2 flex items-center justify-center gap-2 rounded-card bg-primary-dark px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              <ShieldCheck className="h-4 w-4" />
              Verificar código
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
              error={resetErrors.password}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setResetErrors((prev) => ({ ...prev, password: '' }));
              }}
              placeholder="Mínimo 6 caracteres"
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
