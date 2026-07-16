import { Link } from 'react-router-dom';
import { MapPin, Phone, Clock, Mail } from 'lucide-react';
import Logo from './Logo';
import {
  STORE_ADDRESS,
  STORE_HOURS_LINES,
  STORE_PHONE_DISPLAY,
  STORE_EMAIL,
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
      <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.7fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2">
              <Logo size={32} />
              <span className="text-lg font-bold uppercase tracking-widest">Autocells</span>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-white/80">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {STORE_ADDRESS}
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                WhatsApp: {STORE_PHONE_DISPLAY}
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                <a href={`mailto:${STORE_EMAIL}`} className="transition-colors hover:text-primary">
                  {STORE_EMAIL}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>
                  {STORE_HOURS_LINES.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </span>
              </li>
            </ul>
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
            <div className="mt-4 flex gap-3">
              <a
                href={STORE_FACEBOOK_URL}
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="flex h-9 w-9 items-center justify-center rounded-card bg-white/10 text-white/90 transition-colors hover:bg-primary hover:text-white"
              >
                <FacebookIcon />
              </a>
              <a
                href={STORE_INSTAGRAM_URL}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-card bg-white/10 text-white/90 transition-colors hover:bg-primary hover:text-white"
              >
                <InstagramIcon />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-5 text-center text-xs text-white/50">
          © {new Date().getFullYear()} AUTOCELLS. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
