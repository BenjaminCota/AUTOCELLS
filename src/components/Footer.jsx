import { Link } from 'react-router-dom';
import { MapPin, Phone, Clock } from 'lucide-react';
import Logo from './Logo';
import {
  STORE_ADDRESS,
  STORE_HOURS_LINES,
  STORE_PHONE_DISPLAY,
  STORE_FACEBOOK_URL,
  STORE_INSTAGRAM_URL,
} from '../data/store';
import { FacebookIcon, InstagramIcon } from './SocialIcons';

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
          <div className="mt-2 flex items-start gap-2 text-sm text-white/80">
            <Clock className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              {STORE_HOURS_LINES.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </p>
          </div>
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
              href={STORE_FACEBOOK_URL}
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
