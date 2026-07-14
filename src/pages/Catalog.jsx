import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { categories, priceRanges, useCatalog } from '../data/products';
import ProductCard from '../components/ProductCard';
import CatalogFilters from '../components/CatalogFilters';

const defaultFilters = {
  category: 'Todos',
  status: 'Todos',
  price: 'Todos',
  // Contextuales (dependen de la categoría elegida); se resetean al cambiarla.
  brand: 'Todos',
  storage: 'Todos',
  color: 'Todos',
  compatibleModel: 'Todos',
  chargerInput: 'Todos',
  protectorType: 'Todos',
  privacy: 'Todos',
};

// Sin acentos y en minúsculas, para que "silicon" también encuentre "silicón".
function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export default function Catalog() {
  const { products } = useCatalog();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');

  const [filters, setFilters] = useState(() => {
    const requestedCategory = searchParams.get('categoria');
    return {
      ...defaultFilters,
      category: categories.includes(requestedCategory) ? requestedCategory : defaultFilters.category,
    };
  });

  const hasActiveFilters = Object.keys(defaultFilters).some(
    (key) => filters[key] !== defaultFilters[key],
  );

  const filteredProducts = useMemo(() => {
    const range = priceRanges.find((r) => r.label === filters.price) ?? priceRanges[0];
    const query = normalize(search.trim());

    return products.filter((product) => {
      if (query) {
        const haystack = normalize(
          [
            product.name,
            product.brand,
            product.category,
            product.description,
            product.chargerInput,
            product.screenProtectorType,
            ...(product.compatibleModels ?? []),
          ]
            .filter(Boolean)
            .join(' '),
        );
        if (!haystack.includes(query)) return false;
      }

      if (filters.category !== 'Todos' && product.category !== filters.category) return false;
      if (filters.status !== 'Todos' && product.status !== filters.status.toLowerCase()) return false;
      if (product.price < range.min || product.price > range.max) return false;

      // Contextuales: al cambiar de categoría vuelven a 'Todos', así que solo
      // aplican sobre la categoría que los mostró.
      if (filters.brand !== 'Todos' && product.brand !== filters.brand) return false;
      if (filters.storage !== 'Todos' && !(product.storage ?? []).includes(filters.storage)) return false;
      if (filters.color !== 'Todos' && !(product.colors ?? []).includes(filters.color)) return false;
      if (filters.compatibleModel !== 'Todos' && !(product.compatibleModels ?? []).includes(filters.compatibleModel)) return false;
      if (filters.chargerInput !== 'Todos' && product.chargerInput !== filters.chargerInput) return false;
      if (filters.protectorType !== 'Todos' && product.screenProtectorType !== filters.protectorType) return false;
      if (filters.privacy !== 'Todos' && product.privacy !== filters.privacy) return false;

      return true;
    });
  }, [filters, search, products]);

  function handleFilterChange(key, value) {
    setFilters((prev) =>
      key === 'category'
        ? // Los filtros contextuales de la categoría anterior ya no aplican.
          { ...defaultFilters, status: prev.status, price: prev.price, category: value }
        : { ...prev, [key]: value },
    );
  }

  function clearAll() {
    setFilters(defaultFilters);
    setSearch('');
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold uppercase tracking-wide text-secondary sm:text-3xl">Catálogo</h1>

      {/* Buscador */}
      <div className="relative mt-4">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nombre, marca o modelo…"
          aria-label="Buscar productos"
          className="w-full rounded-card border border-secondary/20 bg-white py-3 pl-12 pr-11 text-sm text-secondary placeholder:text-muted transition-colors focus:border-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-dark/20 [&::-webkit-search-cancel-button]:hidden"
        />
        {search && (
          <button
            type="button"
            aria-label="Borrar búsqueda"
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted transition-colors hover:text-primary-dark"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <p className="mt-3 text-muted">{filteredProducts.length} productos encontrados</p>

      <div className="mt-3">
        <CatalogFilters
          filters={filters}
          onChange={handleFilterChange}
          onReset={() => setFilters(defaultFilters)}
          hasActiveFilters={hasActiveFilters}
        />
      </div>

      {/* sr-only: evita saltar de h1 a los h3 de ProductCard sin un h2 intermedio */}
      <h2 className="sr-only">Resultados</h2>

      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-secondary/20 py-16 text-center text-muted">
          <p>No encontramos productos que coincidan con tu búsqueda y filtros.</p>
          <button
            type="button"
            onClick={clearAll}
            className="text-sm font-semibold text-primary-dark hover:underline"
          >
            Limpiar búsqueda y filtros
          </button>
        </div>
      )}
    </div>
  );
}
