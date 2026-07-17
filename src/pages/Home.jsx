import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Smartphone, Unlock, ShieldCheck, Award, Truck, ArrowRight } from 'lucide-react';
import { categories, categorySlug, useCatalog } from '../data/products';
import ProductCard, { categoryIcons, priceFormatter } from '../components/ProductCard';
import { STORE_FACEBOOK_URL } from '../data/store';
import { FacebookIcon } from '../components/SocialIcons';

const categoryCards = categories.filter((category) => category !== 'Todos');

// Actualizar estos ids cuando se capturen los productos reales en data/products.js.
const featuredProductIds = ['iphone-15-128gb', 'iphone-14-128gb', 'funda-silicon-iphone-13', 'cargador-20w-anker'];

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
        <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
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
              className="group animate-hero-in-image relative flex aspect-square items-center justify-center overflow-hidden rounded-card bg-bg-alt [animation-delay:90ms]"
            >
              {pinned.image ? (
                <img
                  src={pinned.image}
                  alt={pinned.name}
                  className="h-full w-full object-contain p-12 pb-24 transition-transform duration-200 ease-snappy group-hover:scale-[1.03]"
                />
              ) : (
                <PinnedIcon className="h-32 w-32 text-primary-dark" strokeWidth={1.25} />
              )}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-4 bg-white/85 px-6 py-4 backdrop-blur-sm">
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

      {/* Categorías al estilo Apple Store: visual centrado + etiqueta debajo,
          sin tarjetas ni bordes; los ítems flotan sobre la banda gris. En móvil
          la fila hace scroll horizontal; en desktop se reparte a lo ancho. */}
      <section className="bg-bg-alt">
        <div className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-secondary sm:text-3xl">Explora por categoría</h2>
          <div className="-mx-4 mt-10 flex gap-8 overflow-x-auto px-4 pb-2 sm:mx-0 sm:gap-4 sm:overflow-visible sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categoryCards.map((category, index) => {
              const Icon = categoryIcons[category];
              const image = `${import.meta.env.BASE_URL}images/categories/${categorySlug(category)}.jpg`;
              return (
                <Link
                  key={category}
                  to={`/catalogo?categoria=${encodeURIComponent(category)}`}
                  style={{ animationDelay: `${index * 60}ms` }}
                  className="group animate-rise-in flex w-24 shrink-0 flex-col items-center gap-4 rounded-card py-2 sm:w-auto sm:flex-1"
                >
                  <span className="flex h-24 items-center justify-center transition-transform duration-200 ease-snappy group-hover:-translate-y-1.5">
                    {/* Foto real de la categoría (public/images/categories/<slug>.jpg,
                        Unsplash, recorte cuadrado) en círculo — las fotos traen fondo
                        propio, así que el círculo las integra a la banda gris. Si el
                        archivo faltara, cae al ícono de categoría. */}
                    <img
                      src={image}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      width="480"
                      height="480"
                      className="h-24 w-24 rounded-full object-cover shadow-[0_10px_24px_-12px_rgba(88,89,91,0.5)] ring-1 ring-secondary/10 transition-shadow duration-200 ease-snappy group-hover:shadow-[0_16px_32px_-14px_rgba(14,116,144,0.55)]"
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

      {/* R-SIM destacado: panel de marca (color cian carga la sección) en vez
          del ícono-en-círculo genérico. */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8">
          <div className="relative flex flex-col items-start gap-6 overflow-hidden rounded-card bg-primary-dark px-6 py-12 text-white sm:px-12 lg:flex-row lg:items-center lg:justify-between">
            <Unlock
              className="pointer-events-none absolute -right-8 -top-8 h-52 w-52 text-white/10"
              strokeWidth={1}
              aria-hidden="true"
            />
            <div className="relative max-w-xl">
              <h2 className="text-2xl font-bold sm:text-3xl">Liberación por R-SIM desde $300</h2>
              <p className="mt-3 text-white/85">
                ¿Tu iPhone está bloqueado a una compañía? Lo liberamos el mismo día, con revisión sin
                costo.
              </p>
            </div>
            <Link
              to="/servicios"
              className="relative inline-flex shrink-0 items-center gap-2 rounded-card bg-white px-6 py-3.5 text-base font-semibold text-primary-dark shadow-sm transition-transform duration-150 ease-snappy hover:-translate-y-0.5 active:scale-95"
            >
              Conoce el servicio
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Productos destacados — se oculta mientras el catálogo esté vacío */}
      {featuredProducts.length > 0 && (
        <section className="bg-bg-alt">
          <div className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-secondary">Productos destacados</h2>
              <Link to="/catalogo" className="text-sm font-semibold text-primary-dark hover:underline">
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

      {/* Banner de confianza */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-[1440px] gap-8 px-4 py-16 sm:grid-cols-3 sm:px-6 lg:px-8">
          {trustPoints.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex flex-col items-center gap-2 text-center">
              <Icon className="h-8 w-8 text-primary-dark" strokeWidth={1.5} />
              <h3 className="font-semibold text-secondary">{title}</h3>
              <p className="text-sm text-muted">{description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
