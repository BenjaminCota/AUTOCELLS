import { MapPin, Phone, Clock, MessageCircle, ArrowUpRight } from 'lucide-react';
import {
  STORE_ADDRESS,
  STORE_HOURS,
  STORE_PHONE_DISPLAY,
  STORE_MAPS_EMBED_URL,
  STORE_MAPS_LINK,
  STORE_FACEBOOK_URL,
  STORE_INSTAGRAM_URL,
  whatsappLink,
} from '../data/store';
import { FacebookIcon, InstagramIcon } from '../components/SocialIcons';

const socialLinks = [
  {
    name: 'Facebook',
    handle: 'AUTOCELLS',
    description: 'Promociones, equipos recién llegados y avisos de la tienda.',
    href: STORE_FACEBOOK_URL,
    Icon: FacebookIcon,
  },
  {
    name: 'Instagram',
    handle: '@autocellslopez',
    description: 'Fotos y novedades del inventario en tiempo real.',
    href: STORE_INSTAGRAM_URL,
    Icon: InstagramIcon,
  },
];

export default function Contact() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-secondary sm:text-4xl">Contacto</h1>
      <p className="mt-2 max-w-prose text-muted">
        ¿Dudas sobre un equipo o la liberación por R-SIM? Escríbenos o pasa a la tienda.
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        {/* Mapa + info */}
        <div className="flex flex-col gap-6">
          <div className="overflow-hidden rounded-card border border-secondary/10">
            <iframe
              title="Ubicación de AUTOCELLS"
              src={STORE_MAPS_EMBED_URL}
              className="h-72 w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div className="flex flex-col gap-4 rounded-card border border-secondary/10 bg-bg-alt p-6">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary-dark" />
              <div>
                <p className="text-secondary">{STORE_ADDRESS}</p>
                <a
                  href={STORE_MAPS_LINK}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-primary-dark hover:underline"
                >
                  Cómo llegar
                </a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 shrink-0 text-primary-dark" />
              <p className="text-secondary">WhatsApp: {STORE_PHONE_DISPLAY}</p>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 shrink-0 text-primary-dark" />
              <p className="text-secondary">{STORE_HOURS}</p>
            </div>

            <a
              href={whatsappLink('Hola, tengo una pregunta sobre AUTOCELLS.')}
              target="_blank"
              rel="noreferrer"
              className="mt-2 flex items-center justify-center gap-2 rounded-card bg-primary-dark px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              <MessageCircle className="h-5 w-5" />
              Preguntar por WhatsApp
            </a>
          </div>
        </div>

        {/* Redes sociales */}
        <div className="flex flex-col gap-4 rounded-card border border-secondary/10 p-6">
          <h2 className="text-xl font-bold text-secondary">Síguenos en redes</h2>
          <p className="text-muted">
            La forma más rápida de ver lo nuevo: publicamos primero en nuestras redes sociales.
          </p>
          {socialLinks.map(({ name, handle, description, href, Icon }) => (
            <a
              key={name}
              href={href}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-4 rounded-card border border-secondary/10 p-4 transition-colors hover:border-primary-dark/40 hover:bg-bg-alt"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-dark/10 text-primary-dark">
                <Icon className="h-6 w-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1 font-semibold text-secondary">
                  {name}
                  <ArrowUpRight className="h-4 w-4 text-muted transition-colors group-hover:text-primary-dark" />
                </span>
                <span className="block text-sm font-medium text-primary-dark">{handle}</span>
                <span className="mt-1 block text-sm text-muted">{description}</span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
