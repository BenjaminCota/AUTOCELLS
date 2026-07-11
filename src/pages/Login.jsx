import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import logoFull from '../assets/logo-full.png';
import FormField from '../components/FormField';
import Alert from '../components/Alert';
import { isAuthenticated, login } from '../routes/auth';

// Credenciales demo: sin backend real todavía.
const DEMO_EMAIL = 'admin@autocells.com';
const DEMO_PASSWORD = 'admin123';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });

  if (isAuthenticated()) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const email = form.email.trim();
    if (!email || !form.password) {
      setError('Completa tu correo y contraseña para continuar.');
      setFieldErrors({
        email: email ? '' : 'Ingresa tu correo.',
        password: form.password ? '' : 'Ingresa tu contraseña.',
      });
      return;
    }

    const validEmail = email.toLowerCase() === DEMO_EMAIL;
    const validPassword = form.password === DEMO_PASSWORD;

    if (!validEmail) {
      setError('No encontramos una cuenta con ese correo.');
      setFieldErrors({ email: 'Correo no registrado.', password: '' });
      return;
    }

    if (!validPassword) {
      setError('La contraseña es incorrecta.');
      setFieldErrors({ email: '', password: 'Contraseña incorrecta.' });
      return;
    }

    login();
    const redirectTo = location.state?.from?.pathname ?? '/admin/dashboard';
    navigate(redirectTo, { replace: true });
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-bg-alt px-4 py-16">
      <div className="w-full max-w-md rounded-card border border-secondary/10 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center gap-2 text-center">
          <img src={logoFull} alt="AUTOCELLS" className="h-20 w-auto" />
          <h1 className="mt-2 text-2xl font-bold text-secondary">Iniciar sesión</h1>
          <p className="text-sm text-muted">Accede al panel de administración</p>
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
            className="mt-2 flex items-center justify-center gap-2 rounded-card bg-primary-dark px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            <LogIn className="h-4 w-4" />
            Iniciar sesión
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted">
          Demo: {DEMO_EMAIL} / {DEMO_PASSWORD}
        </p>
      </div>
    </div>
  );
}
