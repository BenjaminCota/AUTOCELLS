import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MailCheck, MailX, Mail, LoaderCircle } from 'lucide-react';
import { verifyEmail, resendVerification } from '../data/users';
import { useToast } from '../context/ToastContext';

// Aterrizaje del enlace del correo de verificación (paso 5-7 del flujo:
// clic → el server valida el token → la cuenta pasa a verificada). El server
// es idempotente mientras el token no venza: recargar la página con un token
// ya usado vuelve a mostrar éxito.

// StrictMode monta el efecto dos veces en dev: se memoriza la petición por
// token para disparar un solo POST por enlace.
const verifyRequests = new Map();
function verifyOnce(token) {
  if (!verifyRequests.has(token)) verifyRequests.set(token, verifyEmail(token));
  return verifyRequests.get(token);
}

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const token = searchParams.get('token') ?? '';

  // 'verifying' → 'success' | 'expired' (ofrece reenvío) | 'invalid'
  const [status, setStatus] = useState('verifying');
  const [account, setAccount] = useState({ name: '', email: '' });
  const [resending, setResending] = useState(false);
  // Enlace de dev cuando el SMTP no está configurado (ver server/mailer.js).
  const [devVerifyUrl, setDevVerifyUrl] = useState(null);

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      return undefined;
    }
    let active = true;
    verifyOnce(token)
      .then((result) => {
        if (!active) return;
        setAccount({ name: result.name, email: result.email });
        setStatus('success');
      })
      .catch((error) => {
        if (!active) return;
        if (error.expired && error.email) {
          setAccount({ name: '', email: error.email });
          setStatus('expired');
        } else {
          setStatus('invalid');
        }
      });
    return () => {
      active = false;
    };
  }, [token]);

  async function handleResend() {
    if (resending) return;
    setResending(true);
    try {
      const result = await resendVerification(account.email);
      setDevVerifyUrl(result.devVerifyUrl ?? null);
      toast.info(`Te reenviamos el correo de verificación a ${account.email}.`);
    } catch (resendError) {
      // 429 = límite de reenvíos: el mensaje del server pide esperar.
      toast.error(
        resendError.status === 429 ? resendError.message : 'No se pudo reenviar el correo. Inténtalo de nuevo.',
      );
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-5 px-4 py-24 text-center">
      {status === 'verifying' && (
        <>
          <LoaderCircle className="h-10 w-10 animate-spin text-primary-dark" />
          <h1 className="text-2xl font-bold text-secondary">Verificando tu correo…</h1>
        </>
      )}

      {status === 'success' && (
        <>
          <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <MailCheck className="h-8 w-8 text-success-dark" strokeWidth={1.5} />
          </span>
          <h1 className="text-3xl font-bold text-secondary">¡Correo verificado!</h1>
          <p className="max-w-prose text-muted">
            {account.name ? `${account.name.split(' ')[0]}, tu` : 'Tu'} cuenta quedó activa.
            Inicia sesión para comprar y dar seguimiento a tus pedidos.
          </p>
          <Link
            to="/login"
            className="rounded-card bg-primary-dark px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            Iniciar sesión
          </Link>
        </>
      )}

      {status === 'expired' && (
        <>
          <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-danger/10">
            <MailX className="h-8 w-8 text-danger-dark" strokeWidth={1.5} />
          </span>
          <h1 className="text-3xl font-bold text-secondary">El enlace ya venció</h1>
          <p className="max-w-prose text-muted">
            Los enlaces de verificación duran 24 horas. Pide uno nuevo para{' '}
            <span className="font-semibold text-secondary">{account.email}</span> y revisa tu
            bandeja de entrada.
          </p>
          {devVerifyUrl && (
            <div className="w-full rounded-card border border-primary-dark/20 bg-primary/5 p-4">
              <p className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary-dark">
                <Mail className="h-4 w-4" />
                Correo simulado (SMTP sin configurar)
              </p>
              <a
                href={devVerifyUrl}
                className="mt-2 inline-block break-all text-sm font-semibold text-primary-dark hover:underline"
              >
                Abrir enlace de verificación nuevo
              </a>
            </div>
          )}
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="flex items-center justify-center gap-2 rounded-card bg-primary-dark px-6 py-3 text-sm font-semibold text-white transition-colors enabled:hover:bg-primary-hover disabled:opacity-70"
          >
            {resending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            Reenviar correo
          </button>
        </>
      )}

      {status === 'invalid' && (
        <>
          <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-danger/10">
            <MailX className="h-8 w-8 text-danger-dark" strokeWidth={1.5} />
          </span>
          <h1 className="text-3xl font-bold text-secondary">Enlace no válido</h1>
          <p className="max-w-prose text-muted">
            El enlace de verificación no es válido o ya se usó. Si tu cuenta ya está verificada,
            solo inicia sesión; si no, regístrate de nuevo o pide otro correo desde el registro.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              to="/login"
              className="rounded-card bg-primary-dark px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              Iniciar sesión
            </Link>
            <Link
              to="/registro"
              className="rounded-card border border-secondary/20 px-6 py-3 text-sm font-semibold text-secondary transition-colors hover:border-primary-dark hover:text-primary-dark"
            >
              Ir al registro
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
