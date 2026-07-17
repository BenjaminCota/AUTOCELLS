import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Smartphone,
  Unlock,
  ShieldCheck,
  Award,
  Truck,
  ArrowRight,
  ShoppingCart,
  ClipboardCheck,
  Store,
  MapPin,
  Clock,
  MessageCircle,
  CheckCircle2,
} from 'lucide-react';
import { categories, categorySlug, useCatalog } from '../data/products';
import ProductCard, { categoryIcons, priceFormatter } from '../components/ProductCard';
import {
  STORE_FACEBOOK_URL,
  STORE_ADDRESS,
  STORE_HOURS_LINES,
  STORE_MAPS_EMBED_URL,
  STORE_MAPS_LINK,
  STORE_PHONE_DISPLAY,
  whatsappLink,
} from '../data/store';
import { FacebookIcon } from '../components/SocialIcons';

const categoryCards = categories.filter((category) => category !== 'Todos');

// Actualizar estos ids cuando se capturen los productos reales en data/products.js.
const featuredProductIds = ['iphone-15-128gb', 'iphone-14-128gb', 'funda-silicon-iphone-13', 'cargador-20w-anker'];

// Lo que el cliente gana con la liberación (se pinta en el banner R-SIM).
const rsimPerks = ['Desde $300', 'Listo el mismo día', 'Sin abrir tu equipo', 'Cualquier compañía'];

// Modelo real de la tienda: pedido web + pago al recoger (no hay cobro en línea).
const buySteps = [
  {
    icon: ShoppingCart,
    title: 'Arma tu pedido',
    description: 'Explora el catálogo y agrega al carrito los equipos y accesorios que quieras.',
  },
  {
    icon: ClipboardCheck,
    title: 'Confírmalo en línea',
    description: 'Crea tu cuenta, confirma tu pedido y nosotros te apartamos las piezas.',
  },
  {
    icon: Store,
    title: 'Recoge y paga en tienda',
    description: 'Pasa por él a la tienda y paga al recogerlo — sin anticipos ni pagos en línea.',
  },
];

const trustPoints = [
  { icon: ShieldCheck, title: 'Compra segura', description: 'Equipos revisados antes de entregarse.' },
  // Regla real de garantía (lib/warranty.js): solo celulares, 1 mes (iPhone 17: 2).
  { icon: Award, title: 'Garantía incluida', description: '1 mes en todos los celulares y 2 meses en iPhone 17.' },
  { icon: Truck, title: 'Entrega local', description: 'Recoge en tienda en San Luis Río Colorado.' },
];

export default function Home() {
  const { products } = useCatalog();

  // El producto anclado desde el admin (estrella en Admin → Productos) siempre
  // va primero y además protagoniza el hero. El resto rellena con los ids
  // capturados a mano o, si no existen (el catálogo estático está vacío), con
  // los más recientes del admin.
  const { pinned, featuredProducts } = useMemo(() => {
    const pinned = products.find((product) => product.featured);
    const handpicked = featuredProductIds
      .map((id) => products.find((product) => product.id === id))
      .filter(Boolean);
    const rest = (handpicked.length > 0 ? handpicked : products).filter(
      (product) => product !== pinned,
    );
    return { pinned, featuredProducts: [...(pinned ? [pinned] : []), ...rest].slice(0, 4) };
  }, [products]);

  // Los productos del admin pueden venir sin foto: mismo fallback al ícono de
  // categoría que usa ProductCard.
  const PinnedIcon = pinned ? (categoryIcons[pinned.category] ?? Smartphone) : Smartphone;

  return (
    <div>
      {/* Hero */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
          <div>
            <h1 className="animate-hero-in text-3xl font-bold text-secondary sm:text-4xl lg:text-5xl">
              iPhones al mejor precio en San Luis Río Colorado
            </h1>
            <p className="animate-hero-in mt-4 max-w-prose text-muted [animation-delay:70ms]">
              Equipos nuevos y seminuevos, accesorios originales y liberación por R-SIM el mismo día.
            </p>
            <div className="animate-hero-in mt-6 flex flex-col gap-3 sm:flex-row [animation-delay:130ms]">
              <Link
                to="/catalogo"
                className="flex items-center justify-center gap-2 rounded-card bg-primary-dark px-6 py-3.5 text-base font-semibold text-white shadow-sm transition-[background-color,transform,box-shadow] duration-150 ease-snappy hover:bg-primary-hover hover:shadow-md active:scale-[0.97] active:bg-primary-hover active:shadow-sm"
              >
                Ver catálogo
              </Link>
              <a
                href={STORE_FACEBOOK_URL}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-card border border-secondary/20 px-6 py-3.5 text-base font-semibold text-secondary transition-colors hover:border-primary-dark hover:text-primary-dark"
              >
                <FacebookIcon className="h-5 w-5" />
                Contáctanos por Facebook
              </a>
            </div>
          </div>

          {/* El hero muestra el producto destacado (columna `featured`); sin
              destacado se queda el placeholder de siempre. */}
          {pinned ? (
            <Link
              to={`/catalogo/${categorySlug(pinned.category)}/${pinned.id}`}
              // Fondo blanco: las fotos de producto traen fondo blanco y así se
              // funden con el panel (sin marco gris alrededor); el borde marca
              // el límite. Padding mínimo para que la foto se vea grande.
              className="group animate-hero-in-image relative flex aspect-square items-center justify-center overflow-hidden rounded-card border border-secondary/10 bg-white [animation-delay:90ms]"
            >
              {pinned.image ? (
                <img
                  src={pinned.image}
                  alt={pinned.name}
                  className="h-full w-full object-contain p-2 pb-16 transition-transform duration-200 ease-snappy group-hover:scale-[1.03]"
                />
              ) : (
                <PinnedIcon className="h-32 w-32 text-primary-dark" strokeWidth={1.25} />
              )}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-4 border-t border-secondary/10 bg-white/85 px-6 py-4 backdrop-blur-sm">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">Producto destacado</p>
                  <p className="font-semibold text-secondary group-hover:text-primary-dark">{pinned.name}</p>
                </div>
                <p className="text-lg font-bold text-secondary">{priceFormatter.format(pinned.price)}</p>
              </div>
            </Link>
          ) : (
            <div className="animate-hero-in-image flex aspect-square items-center justify-center rounded-card bg-bg-alt [animation-delay:90ms]">
              <Smartphone className="h-32 w-32 text-primary-dark" strokeWidth={1.25} />
            </div>
          )}
        </div>
      </section>

      {/* Categorías al estilo Apple Store: foto de producto grande + etiqueta,
          sin tarjetas ni recuadros. Las fotos (public/images/categories/
          <slug>.jpg) traen fondo blanco, por eso la sección es blanca: se
          funden con ella y "flotan". En móvil la fila hace scroll horizontal;
          en desktop se reparte a lo ancho. */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-secondary sm:text-3xl">Explora por categoría</h2>
          <div className="-mx-4 mt-6 flex gap-6 overflow-x-auto px-4 pb-2 sm:mx-0 sm:gap-4 sm:overflow-visible sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categoryCards.map((category, index) => {
              const Icon = categoryIcons[category];
              const image = `${import.meta.env.BASE_URL}images/categories/${categorySlug(category)}.jpg`;
              return (
                <Link
                  key={category}
                  to={`/catalogo?categoria=${encodeURIComponent(category)}`}
                  style={{ animationDelay: `${index * 60}ms` }}
                  className="group animate-rise-in flex w-28 shrink-0 flex-col items-center gap-2 sm:w-auto sm:flex-1"
                >
                  <span className="flex items-center justify-center transition-transform duration-200 ease-snappy group-hover:-translate-y-1.5">
                    {/* Cuadrada y sin adornos; si el archivo faltara, cae al
                        ícono de categoría. */}
                    <img
                      src={image}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      width="480"
                      height="480"
                      className="h-28 w-28 object-contain sm:h-40 sm:w-40"
                      onError={(event) => {
                        event.currentTarget.style.display = 'none';
                        event.currentTarget.nextElementSibling?.removeAttribute('hidden');
                      }}
                    />
                    <Icon hidden className="h-14 w-14 text-primary-dark" strokeWidth={1.25} />
                  </span>
                  <span className="text-center text-sm font-semibold text-secondary transition-colors group-hover:text-primary-dark">
                    {category}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* R-SIM destacado: banner con gradiente de marca, checklist de beneficios,
          doble CTA y el celular en tarjeta blanca flotante (animación float-y). */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-card bg-gradient-to-br from-primary-dark to-primary-hover text-white">
            <Unlock
              className="pointer-events-none absolute -right-8 -top-8 h-52 w-52 text-white/10"
              strokeWidth={1}
              aria-hidden="true"
            />
            <div className="relative grid items-center gap-8 px-6 py-10 sm:px-12 lg:grid-cols-[1.25fr_0.75fr]">
              <div>
                <h2 className="text-2xl font-bold sm:text-3xl">
                  ¿Tu iPhone está bloqueado? Lo liberamos hoy mismo
                </h2>
                <p className="mt-3 max-w-prose text-white/85">
                  Con la liberación por R-SIM tu iPhone acepta el chip de cualquier compañía, en
                  México o en el extranjero, sin abrirlo ni perder la garantía. La revisión y el
                  diagnóstico no tienen costo.
                </p>
                <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-white/95">
                  {rsimPerks.map((perk) => (
                    <li key={perk} className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      {perk}
                    </li>
                  ))}
                </ul>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Link
                    to="/servicios"
                    className="inline-flex items-center justify-center gap-2 rounded-card bg-white px-6 py-3.5 text-base font-semibold text-primary-dark shadow-sm transition-transform duration-150 ease-snappy hover:-translate-y-0.5 active:scale-95"
                  >
                    Conoce el servicio
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                  <a
                    href={whatsappLink('Hola, quiero liberar mi iPhone por R-SIM.')}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-card border border-white/40 px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/10"
                  >
                    <MessageCircle className="h-5 w-5" />
                    Escríbenos
                  </a>
                </div>
              </div>
              {/* El render trae fondo blanco: en tarjeta blanca inclinada se ve
                  intencional sobre el cian, y la flotación le da vida. */}
              <div className="relative hidden justify-center lg:flex">
                <div className="animate-float">
                  <div className="rotate-3 rounded-card bg-white p-5 shadow-2xl">
                    <img
                      src={`${import.meta.env.BASE_URL}images/categories/celulares.jpg`}
                      alt="iPhone listo para usar con cualquier compañía"
                      loading="lazy"
                      className="h-56 w-56 object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Productos destacados — se oculta mientras el catálogo esté vacío */}
      {featuredProducts.length > 0 && (
        <section className="bg-bg-alt">
          <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-secondary">Productos destacados</h2>
                <p className="mt-1 text-sm text-muted">Lo más nuevo y lo más pedido de la tienda.</p>
              </div>
              <Link
                to="/catalogo"
                className="shrink-0 text-sm font-semibold text-primary-dark hover:underline"
              >
                Ver catálogo completo
              </Link>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
              {featuredProducts.map((product, index) => (
                <div key={product.id} className="animate-rise-in" style={{ animationDelay: `${index * 70}ms` }}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Cómo comprar: el modelo real (pedido web, pago al recoger) en 3 pasos
          conectados — mismo patrón visual que "Cómo funciona" de Servicios. */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-secondary sm:text-3xl">
            Compra en línea, recoge en tienda
          </h2>
          <p className="mx-auto mt-2 max-w-prose text-center text-muted">
            Sin pagos por adelantado: apartas tu pedido desde el sitio y pagas al recogerlo.
          </p>
          <div className="relative mt-8 grid gap-8 sm:grid-cols-3">
            {/* Línea que conecta los pasos; el ring blanco de cada ícono la corta. */}
            <div className="pointer-events-none absolute left-[16.66%] right-[16.66%] top-7 hidden h-0.5 bg-primary-dark/15 sm:block" />
            {buySteps.map(({ icon: Icon, title, description }, index) => (
              <div key={title} className="relative flex flex-col items-center gap-3 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-dark text-white ring-8 ring-white">
                  <Icon className="h-6 w-6" strokeWidth={1.75} />
                </span>
                <h3 className="font-semibold text-secondary">
                  {index + 1}. {title}
                </h3>
                <p className="max-w-xs text-sm text-muted">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Banner de confianza */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-[1440px] gap-8 border-t border-secondary/10 px-4 py-10 sm:grid-cols-3 sm:px-6 lg:px-8">
          {trustPoints.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex flex-col items-center gap-2 text-center">
              <Icon className="h-8 w-8 text-primary-dark" strokeWidth={1.5} />
              <h3 className="font-semibold text-secondary">{title}</h3>
              <p className="text-sm text-muted">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Visítanos: mapa real + datos de la tienda — contenido útil que además
          le da peso visual al final del inicio. */}
      <section className="bg-bg-alt">
        <div className="mx-auto grid max-w-[1440px] items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="overflow-hidden rounded-card border border-secondary/10 shadow-sm">
            <iframe
              title="Ubicación de AUTOCELLS"
              src={STORE_MAPS_EMBED_URL}
              className="h-[300px] w-full sm:h-[380px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-secondary sm:text-3xl">Visítanos en la tienda</h2>
            <p className="mt-3 max-w-prose text-muted">
              Somos una tienda local de San Luis Río Colorado especializada en iPhones nuevos y
              seminuevos, accesorios y liberación por R-SIM. Ven a conocer el equipo que te interesa,
              pedir una cotización o recoger tu pedido web.
            </p>
            <ul className="mt-5 space-y-3 text-sm text-secondary">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary-dark" />
                {STORE_ADDRESS}
              </li>
              <li className="flex items-start gap-3">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary-dark" />
                <span>
                  {STORE_HOURS_LINES.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary-dark" />
                WhatsApp: {STORE_PHONE_DISPLAY}
              </li>
            </ul>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href={STORE_MAPS_LINK}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-card bg-primary-dark px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
              >
                Cómo llegar
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href={whatsappLink('Hola, quiero información sobre un producto.')}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-card border border-secondary/20 px-6 py-3 text-sm font-semibold text-secondary transition-colors hover:border-primary-dark hover:text-primary-dark"
              >
                <MessageCircle className="h-4 w-4" />
                Escríbenos por WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
