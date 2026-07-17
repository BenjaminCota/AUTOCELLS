import { Link } from 'react-router-dom';
import { MapPin, Phone, Clock, Mail, ArrowUpRight } from 'lucide-react';
import {
  STORE_ADDRESS,
  STORE_HOURS_LINES,
  STORE_PHONE_DISPLAY,
  STORE_EMAIL,
  STORE_MAPS_EMBED_URL,
  STORE_MAPS_LINK,
  STORE_FACEBOOK_URL,
  STORE_INSTAGRAM_URL,
  whatsappLink,
} from '../data/store';
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from '../components/SocialIcons';

// Métodos de contacto directos. `accent` resalta el preferido (WhatsApp) y
// `external` decide si el enlace abre en pestaña nueva (mailto no).
const contactMethods = [
  {
    name: 'WhatsApp',
    value: STORE_PHONE_DISPLAY,
    description: 'La vía más rápida, en horario de tienda.',
    href: whatsappLink('Hola, tengo una pregunta sobre AUTOCELLS.'),
    Icon: WhatsAppIcon,
    external: true,
    accent: true,
  },
  {
    name: 'Correo',
    value: STORE_EMAIL,
    description: 'Para cotizaciones y dudas más detalladas.',
    href: `mailto:${STORE_EMAIL}`,
    Icon: Mail,
    external: false,
  },
  {
    name: 'Facebook',
    value: 'AUTOCELLS',
    description: 'Promociones y equipos recién llegados.',
    href: STORE_FACEBOOK_URL,
    Icon: FacebookIcon,
    external: true,
  },
  {
    name: 'Instagram',
    value: '@autocellslopez',
    description: 'Fotos y novedades del inventario.',
    href: STORE_INSTAGRAM_URL,
    Icon: InstagramIcon,
    external: true,
  },
];

// Respuestas reales del modelo de la tienda (pedido web + pago al recoger,
// garantía de lib/warranty.js, liberación el mismo día) — nada inventado.
const faqs = [
  {
    q: '¿Puedo pagar en línea?',
    a: 'No manejamos cobros en línea: tu pedido web aparta las piezas y pagas al recogerlas en la tienda.',
  },
  {
    q: '¿Hacen envíos a domicilio?',
    a: 'Por ahora la entrega es en la tienda, en San Luis Río Colorado. Te avisamos en cuanto tu pedido esté listo.',
  },
  {
    q: '¿Los equipos tienen garantía?',
    a: 'Los celulares incluyen 1 mes de garantía (iPhone 17: 2 meses). Fundas, cargadores y demás accesorios no manejan garantía.',
  },
  {
    q: '¿Cuánto tarda la liberación por R-SIM?',
    a: 'Queda el mismo día. Agenda tu cita en la página de Servicios y trae tu iPhone; la revisión no tiene costo.',
  },
  {
    q: '¿Necesito una cuenta para comprar?',
    a: 'Sí: creas tu cuenta, verificas tu correo y listo. El catálogo lo puedes explorar sin cuenta.',
  },
  {
    q: '¿Venden equipos nuevos o seminuevos?',
    a: 'Ambos. Cada producto dice claramente su estado: nuevo, seminuevo o usado como nuevo.',
  },
];

export default function Contact() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-secondary sm:text-4xl">Contacto</h1>
      <p className="mt-2 max-w-prose text-muted">
        ¿Dudas sobre un equipo o la liberación por R-SIM? Escríbenos por el medio que prefieras o pasa
        a la tienda.
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.35fr_1fr] lg:items-start">
        {/* Mapa grande + datos de la tienda */}
        <div className="flex flex-col gap-6">
          <div className="overflow-hidden rounded-card border border-secondary/10 shadow-sm">
            <iframe
              title="Ubicación de AUTOCELLS"
              src={STORE_MAPS_EMBED_URL}
              className="h-[360px] w-full sm:h-[460px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div className="grid gap-5 rounded-card border border-secondary/10 bg-bg-alt p-6 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary-dark" />
              <div>
                <p className="font-semibold text-secondary">Dónde estamos</p>
                <p className="mt-1 text-sm text-muted">{STORE_ADDRESS}</p>
                <a
                  href={STORE_MAPS_LINK}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-sm font-medium text-primary-dark hover:underline"
                >
                  Cómo llegar
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary-dark" />
              <div>
                <p className="font-semibold text-secondary">Horario</p>
                {STORE_HOURS_LINES.map((line) => (
                  <p key={line} className="mt-1 text-sm text-muted">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Métodos de contacto directos */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary-dark" />
            <h2 className="text-xl font-bold text-secondary">Escríbenos directo</h2>
          </div>
          {contactMethods.map(({ name, value, description, href, Icon, external, accent }) => (
            <a
              key={name}
              href={href}
              target={external ? '_blank' : undefined}
              rel={external ? 'noreferrer' : undefined}
              className={`group flex items-center gap-4 rounded-card border p-4 transition-[transform,border-color,background-color,box-shadow] duration-200 ease-snappy hover:-translate-y-0.5 ${
                accent
                  ? 'border-primary-dark/30 bg-primary/5 hover:border-primary-dark/50 hover:shadow-[0_16px_32px_-20px_rgba(14,116,144,0.5)]'
                  : 'border-secondary/10 hover:border-primary-dark/40 hover:bg-bg-alt'
              }`}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-card bg-primary-dark/10 text-primary-dark transition-transform duration-200 ease-snappy group-hover:scale-110">
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1 font-semibold text-secondary">
                  {name}
                  <ArrowUpRight className="h-4 w-4 text-muted transition-colors group-hover:text-primary-dark" />
                </span>
                <span className="block truncate text-sm font-medium text-primary-dark">{value}</span>
                <span className="mt-0.5 block text-sm text-muted">{description}</span>
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* Preguntas frecuentes: contenido útil real que además llena la página.
          Lista editorial con divisores (sin rejilla de tarjetas idénticas). */}
      <section className="mt-14">
        <h2 className="text-2xl font-bold text-secondary">Preguntas frecuentes</h2>
        <p className="mt-1 text-muted">Lo que más nos preguntan antes de comprar o agendar.</p>
        <dl className="mt-6 grid gap-x-12 sm:grid-cols-2">
          {faqs.map(({ q, a }) => (
            <div key={q} className="border-t border-secondary/10 py-5">
              <dt className="font-semibold text-secondary">{q}</dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-muted">{a}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Cierre con acción: no dejar la página muriendo en la lista de FAQs. */}
      <section className="mt-10 overflow-hidden rounded-card bg-gradient-to-br from-primary-dark to-primary-hover px-6 py-10 text-center text-white sm:px-12">
        <h2 className="text-2xl font-bold sm:text-3xl">¿Listo para estrenar?</h2>
        <p className="mx-auto mt-2 max-w-prose text-white/85">
          Mira lo que tenemos disponible hoy, o agenda tu liberación por R-SIM y estrena compañía el
          mismo día.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/catalogo"
            className="rounded-card bg-white px-6 py-3 text-sm font-semibold text-primary-dark shadow-sm transition-transform duration-150 ease-snappy hover:-translate-y-0.5 active:scale-95"
          >
            Ver catálogo
          </Link>
          <Link
            to="/servicios"
            className="rounded-card border border-white/40 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Agendar liberación
          </Link>
        </div>
      </section>
    </div>
  );
}
