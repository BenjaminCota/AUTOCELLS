import { Link } from 'react-router-dom';
import { MapPin, Phone, Clock } from 'lucide-react';
import Logo from './Logo';
import { STORE_ADDRESS, STORE_HOURS, STORE_PHONE_DISPLAY, STORE_INSTAGRAM_URL } from '../data/store';

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M13.5 22v-9h3l.45-3.5H13.5V4.2c0-1.01.28-1.7 1.73-1.7h1.85V.1C17.24.1 16.2 0 14.4 0h-2.9v3.5h-3V10h3v12h3.5Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

const secondaryLinks = [
  { to: '/catalogo', label: 'Catálogo' },
  { to: '/servicios', label: 'Servicios' },
  { to: '/contacto', label: 'Contacto' },
  { to: '/login', label: 'Iniciar sesión' },
];

export default function Footer() {
  return (
    <footer className="bg-secondary text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <div className="flex items-center gap-2">
            <Logo />
            <span className="text-lg font-bold uppercase tracking-widest">Autocells</span>
          </div>
          <p className="mt-4 flex items-start gap-2 text-sm text-white/80">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
            {STORE_ADDRESS}
          </p>
          <p className="mt-2 flex items-center gap-2 text-sm text-white/80">
            <Phone className="h-4 w-4 shrink-0" />
            WhatsApp: {STORE_PHONE_DISPLAY}
          </p>
          <p className="mt-2 flex items-center gap-2 text-sm text-white/80">
            <Clock className="h-4 w-4 shrink-0" />
            {STORE_HOURS}
          </p>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white">Navegación</h2>
          <ul className="mt-4 space-y-2">
            {secondaryLinks.map(({ to, label }) => (
              <li key={to}>
                <Link to={to} className="text-sm text-white/80 transition-colors hover:text-primary">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white">Síguenos</h2>
          <div className="mt-4 flex flex-col gap-3">
            <a
              href="https://www.facebook.com/profile.php?id=61583954035162#"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm text-white/80 transition-colors hover:text-primary"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                <FacebookIcon />
              </span>
              Facebook
            </a>
            <a
              href={STORE_INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm text-white/80 transition-colors hover:text-primary"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                <InstagramIcon />
              </span>
              Instagram
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/50">
        © {new Date().getFullYear()} AUTOCELLS. Todos los derechos reservados.
      </div>
    </footer>
  );
}
