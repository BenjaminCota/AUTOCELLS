import { Link } from 'react-router-dom';
import { Smartphone, MessageCircle, Unlock, ShieldCheck, Award, Truck } from 'lucide-react';
import { products, categories } from '../data/products';
import ProductCard, { categoryIcons } from '../components/ProductCard';
import { whatsappLink } from '../data/store';

const categoryCards = categories.filter((category) => category !== 'Todos');

const featuredProductIds = ['iphone-15-128gb', 'iphone-14-128gb', 'funda-silicon-iphone-13', 'cargador-20w-anker'];
const featuredProducts = featuredProductIds
  .map((id) => products.find((product) => product.id === id))
  .filter(Boolean);

const trustPoints = [
  { icon: ShieldCheck, title: 'Compra segura', description: 'Equipos revisados antes de entregarse.' },
  { icon: Award, title: 'Garantía incluida', description: 'Respaldo en todos los equipos nuevos y seminuevos.' },
  { icon: Truck, title: 'Entrega local', description: 'Recoge en tienda en San Luis Río Colorado.' },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
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
                href={whatsappLink('Hola, quiero información sobre sus equipos.')}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-card border border-secondary/20 px-6 py-3.5 text-base font-semibold text-secondary transition-colors hover:border-primary-dark hover:text-primary-dark"
              >
                <MessageCircle className="h-5 w-5" />
                Preguntar por WhatsApp
              </a>
            </div>
          </div>

          <div className="animate-hero-in-image flex aspect-square items-center justify-center rounded-card bg-bg-alt [animation-delay:90ms]">
            <Smartphone className="h-32 w-32 text-primary-dark" strokeWidth={1.25} />
          </div>
        </div>
      </section>

      {/* Categorías */}
      <section className="bg-bg-alt">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-secondary">Categorías</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {categoryCards.map((category) => {
              const Icon = categoryIcons[category];
              return (
                <Link
                  key={category}
                  to={`/catalogo?categoria=${encodeURIComponent(category)}`}
                  className="flex flex-col items-center gap-3 rounded-card border border-secondary/10 bg-white p-6 text-center transition-shadow hover:shadow-md"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary-dark">
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="font-semibold text-secondary">{category}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* R-SIM destacado */}
      <section className="bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6 lg:px-8">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary-dark">
            <Unlock className="h-7 w-7" strokeWidth={1.5} />
          </span>
          <h2 className="text-2xl font-bold text-secondary">Liberación por R-SIM desde $300</h2>
          <p className="max-w-prose text-muted">
            ¿Tu iPhone está bloqueado a una compañía? Lo liberamos el mismo día, con revisión sin costo.
          </p>
          <Link to="/servicios" className="text-sm font-semibold text-primary-dark hover:underline">
            Conoce el servicio
          </Link>
        </div>
      </section>

      {/* Productos destacados */}
      <section className="bg-bg-alt">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-secondary">Productos destacados</h2>
            <Link to="/catalogo" className="text-sm font-semibold text-primary-dark hover:underline">
              Ver catálogo completo
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Banner de confianza */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:grid-cols-3 sm:px-6 lg:px-8">
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
