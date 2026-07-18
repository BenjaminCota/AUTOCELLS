import { Link } from 'react-router-dom';
import { MapPin, Phone, Clock, Mail } from 'lucide-react';
import Logo from './Logo';
import {
  STORE_ADDRESS,
  STORE_HOURS,
  STORE_PHONE_DISPLAY,
  STORE_EMAIL,
  STORE_FACEBOOK_URL,
  STORE_INSTAGRAM_URL,
  whatsappLink,
} from '../data/store';
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from './SocialIcons';

const secondaryLinks = [
  { to: '/catalogo', label: 'Catálogo' },
  { to: '/servicios', label: 'Servicios' },
  { to: '/contacto', label: 'Contacto' },
  { to: '/login', label: 'Iniciar sesión' },
];

export default function Footer() {
  return (
    <footer className="bg-secondary text-white">
      <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        {/* Fila 1: marca · navegación · redes (horizontal en desktop para que
            el footer no crezca a lo alto). */}
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Logo size={32} />
            <span className="text-lg font-bold uppercase tracking-widest">Autocells</span>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            {secondaryLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="text-sm text-white/80 transition-colors hover:text-primary"
              >
                {label}
              </Link>
            ))}
          </nav>
          {/* Colores oficiales de cada red (como se ven en sus apps). */}
          <div className="flex items-center gap-3">
            <a
              href={STORE_FACEBOOK_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1877F2] text-white transition-transform duration-150 ease-snappy hover:scale-110"
            >
              <FacebookIcon />
            </a>
            <a
              href={STORE_INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-[linear-gradient(45deg,#f09433_0%,#e6683c_25%,#dc2743_50%,#cc2366_75%,#bc1888_100%)] text-white transition-transform duration-150 ease-snappy hover:scale-110"
            >
              <InstagramIcon />
            </a>
            <a
              href={whatsappLink('Hola, tengo una pregunta sobre AUTOCELLS.')}
              target="_blank"
              rel="noreferrer"
              aria-label="WhatsApp"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366] text-white transition-transform duration-150 ease-snappy hover:scale-110"
            >
              <WhatsAppIcon />
            </a>
          </div>
        </div>

        {/* Fila 2: datos de contacto repartidos a lo ancho (justify-between).
            Centrados formaban una columna angosta que se veía vertical. */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-x-8 gap-y-2 border-t border-white/10 pt-5 text-sm text-white/75">
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-primary" />
            {STORE_ADDRESS}
          </span>
          <span className="flex items-center gap-2">
            <Phone className="h-4 w-4 shrink-0 text-primary" />
            WhatsApp: {STORE_PHONE_DISPLAY}
          </span>
          <a
            href={`mailto:${STORE_EMAIL}`}
            className="flex items-center gap-2 transition-colors hover:text-primary"
          >
            <Mail className="h-4 w-4 shrink-0 text-primary" />
            {STORE_EMAIL}
          </a>
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0 text-primary" />
            {STORE_HOURS}
          </span>
        </div>

        <p className="mt-5 border-t border-white/10 pt-4 text-center text-xs text-white/50">
          © {new Date().getFullYear()} AUTOCELLS. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
