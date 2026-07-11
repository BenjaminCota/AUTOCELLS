import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { products, categories, priceRanges } from '../data/products';
import ProductCard from '../components/ProductCard';
import CatalogFilters from '../components/CatalogFilters';

const defaultFilters = { category: 'Todos', brand: 'Todas', price: 'Todos' };

export default function Catalog() {
  const [searchParams] = useSearchParams();

  const [filters, setFilters] = useState(() => {
    const requestedCategory = searchParams.get('categoria');
    return {
      ...defaultFilters,
      category: categories.includes(requestedCategory) ? requestedCategory : defaultFilters.category,
    };
  });

  const hasActiveFilters =
    filters.category !== defaultFilters.category ||
    filters.brand !== defaultFilters.brand ||
    filters.price !== defaultFilters.price;

  const filteredProducts = useMemo(() => {
    const range = priceRanges.find((r) => r.label === filters.price) ?? priceRanges[0];
    return products.filter((product) => {
      const matchesCategory = filters.category === 'Todos' || product.category === filters.category;
      const matchesBrand = filters.brand === 'Todas' || product.brand === filters.brand;
      const matchesPrice = product.price >= range.min && product.price <= range.max;
      return matchesCategory && matchesBrand && matchesPrice;
    });
  }, [filters]);

  function handleFilterChange(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold uppercase tracking-wide text-secondary sm:text-3xl">Catálogo</h1>
      <p className="mt-1 text-muted">{filteredProducts.length} productos encontrados</p>

      <CatalogFilters
        filters={filters}
        onChange={handleFilterChange}
        onReset={() => setFilters(defaultFilters)}
        hasActiveFilters={hasActiveFilters}
      />

      {/* sr-only: evita saltar de h1 a los h3 de ProductCard sin un h2 intermedio */}
      <h2 className="sr-only">Resultados</h2>

      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-card border border-dashed border-secondary/20 py-16 text-center text-muted">
          No encontramos productos con esos filtros.
        </div>
      )}
    </div>
  );
}
