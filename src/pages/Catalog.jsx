import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Search, X, SearchX, LayoutGrid, ChevronLeft, ChevronRight } from 'lucide-react';
import { categories, categorySlug, priceRanges, productStatuses, useCatalog } from '../data/products';
import ProductCard, { categoryIcons } from '../components/ProductCard';
import CatalogFilters from '../components/CatalogFilters';

// Opciones del ordenamiento. 'recientes' respeta el orden que ya trae el store
// (destacado + más nuevo), así que no reordena.
const sortOptions = [
  { value: 'recientes', label: 'Más recientes' },
  { value: 'precio-asc', label: 'Precio: menor a mayor' },
  { value: 'precio-desc', label: 'Precio: mayor a menor' },
  { value: 'nombre', label: 'Nombre (A–Z)' },
];

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

// Productos por página (20 = divisible entre las 2/4/5 columnas de la rejilla).
const PAGE_SIZE = 20;

// Números de página a mostrar: todos si son pocos; si no, la primera, una
// ventana alrededor de la actual y la última, con "…" en los huecos.
function pageList(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [1];
  if (current > 3) pages.push('…');
  for (let n = Math.max(2, current - 1); n <= Math.min(total - 1, current + 1); n += 1) pages.push(n);
  if (current < total - 2) pages.push('…');
  pages.push(total);
  return pages;
}

// Sin acentos y en minúsculas, para que "silicon" también encuentre "silicón".
function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export default function Catalog() {
  const { products } = useCatalog();
  // La categoría inicial puede venir del path (/catalogo/celulares, como
  // enlaza el breadcrumb del detalle de producto) o del query
  // (?categoria=Celulares, como enlazan los tiles del inicio). Basta leerla
  // al montar: MainLayout remonta la página en cada navegación.
  const { category: categoryParam } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('recientes');

  const [filters, setFilters] = useState(() => {
    const fromPath = categories.find((category) => categorySlug(category) === categoryParam);
    const requestedCategory = searchParams.get('categoria');
    return {
      ...defaultFilters,
      category:
        fromPath ??
        (categories.includes(requestedCategory) ? requestedCategory : defaultFilters.category),
    };
  });

  // La URL también puede cambiar SIN remontar la página (MainLayout comparte
  // key en /catalogo/*): botón atrás/adelante o la miga "Catálogo". Aquí se
  // sincroniza el filtro; los cambios por chip pasan por handleFilterChange
  // (que navega él mismo) y dejan este efecto como no-op.
  useEffect(() => {
    const fromPath = categories.find((category) => categorySlug(category) === categoryParam);
    const requestedCategory = searchParams.get('categoria');
    const target =
      fromPath ??
      (categories.includes(requestedCategory) ? requestedCategory : defaultFilters.category);
    setFilters((prev) =>
      prev.category === target
        ? prev
        : // Los filtros contextuales de la categoría anterior ya no aplican.
          { ...defaultFilters, status: prev.status, price: prev.price, category: target },
    );
  }, [categoryParam, searchParams]);

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
      // El filtro guarda el label ('Usado como nuevo'); el producto trae el
      // value ('usado-como-nuevo'), así que se traduce con productStatuses.
      if (filters.status !== 'Todos') {
        const statusValue = productStatuses.find((option) => option.label === filters.status)?.value;
        if (product.status !== statusValue) return false;
      }
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

  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    switch (sort) {
      case 'precio-asc':
        return list.sort((a, b) => a.price - b.price);
      case 'precio-desc':
        return list.sort((a, b) => b.price - a.price);
      case 'nombre':
        return list.sort((a, b) => a.name.localeCompare(b.name, 'es'));
      default:
        // 'recientes': el store ya llega ordenado (destacado + más nuevo).
        return list;
    }
  }, [filteredProducts, sort]);

  // Paginación: cualquier cambio de filtros/búsqueda/orden regresa a la
  // página 1 (los resultados son otros). currentPage se recorta por si los
  // resultados encogen mientras se está en una página alta.
  const [page, setPage] = useState(1);
  useEffect(() => {
    setPage(1);
  }, [filters, search, sort]);
  const pageCount = Math.max(1, Math.ceil(sortedProducts.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pagedProducts = sortedProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function goToPage(next) {
    setPage(next);
    // La página nueva se lee desde arriba, como una navegación real.
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleFilterChange(key, value) {
    if (key === 'category') {
      // La categoría vive en la URL (/catalogo/<slug>) para que breadcrumb,
      // historial y enlaces compartidos coincidan con lo que se ve. replace:
      // cambiar de chip no debe llenar el historial.
      navigate(value === 'Todos' ? '/catalogo' : `/catalogo/${categorySlug(value)}`, {
        replace: true,
      });
      // Los filtros contextuales de la categoría anterior ya no aplican.
      setFilters((prev) => ({ ...defaultFilters, status: prev.status, price: prev.price, category: value }));
      return;
    }
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  // Volver a 'Todos' implica también salir de /catalogo/<categoria>.
  function clearFilters() {
    navigate('/catalogo', { replace: true });
    setFilters(defaultFilters);
  }

  function clearAll() {
    clearFilters();
    setSearch('');
  }

  return (
    <div className="mx-auto max-w-[1800px] px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold uppercase tracking-wide text-secondary sm:text-3xl">Catálogo</h1>
      <p className="mt-1 text-muted">Explora por categoría o busca el equipo que necesitas.</p>

      {/* Barra de categorías: navegación visible (además del panel "Filtrar").
          En móvil hace scroll horizontal; en desktop envuelve. */}
      <nav
        aria-label="Categorías"
        className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {categories.map((category) => {
          const CategoryIcon = category === 'Todos' ? LayoutGrid : categoryIcons[category] ?? LayoutGrid;
          const isActive = filters.category === category;
          return (
            <button
              key={category}
              type="button"
              onClick={() => handleFilterChange('category', category)}
              aria-pressed={isActive}
              className={`flex shrink-0 items-center gap-2 rounded-card border px-4 py-2.5 text-sm font-semibold transition-[color,background-color,border-color,transform,box-shadow] duration-200 ease-snappy ${
                isActive
                  ? 'border-primary-dark bg-primary-dark text-white shadow-[0_10px_24px_-14px_rgba(14,116,144,0.75)]'
                  : 'border-secondary/15 bg-white text-secondary hover:-translate-y-0.5 hover:border-primary-dark/40 hover:text-primary-dark'
              }`}
            >
              <CategoryIcon className="h-4 w-4" strokeWidth={2} />
              {category}
            </button>
          );
        })}
      </nav>

      {/* Buscador */}
      <div className="relative mt-5">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nombre, marca o modelo…"
          aria-label="Buscar productos"
          className="w-full rounded-card border border-secondary/15 bg-bg-alt py-3 pl-12 pr-11 text-sm text-secondary placeholder:text-muted transition-colors focus:border-primary-dark focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-dark/20 [&::-webkit-search-cancel-button]:hidden"
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

      {/* Barra de resultados: conteo + ordenamiento en la misma fila. */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {sortedProducts.length} {sortedProducts.length === 1 ? 'producto' : 'productos'}
        </p>
        <label className="flex items-center gap-2 text-sm text-muted">
          Ordenar por
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            aria-label="Ordenar productos"
            className="rounded-card border border-secondary/20 bg-white py-2 pl-3 pr-8 text-sm font-medium text-secondary transition-colors focus:border-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-dark/20"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-3">
        <CatalogFilters
          filters={filters}
          onChange={handleFilterChange}
          onReset={clearFilters}
          hasActiveFilters={hasActiveFilters}
        />
      </div>

      {/* sr-only: evita saltar de h1 a los h3 de ProductCard sin un h2 intermedio */}
      <h2 className="sr-only">Resultados</h2>

      {sortedProducts.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 lg:gap-6 xl:grid-cols-5 2xl:grid-cols-6">
            {pagedProducts.map((product, index) => (
              // Entrada escalonada, con tope de delay para que los productos de
              // más abajo no aparezcan con retraso perceptible.
              <div
                key={product.id}
                className="animate-rise-in"
                style={{ animationDelay: `${Math.min(index, 7) * 55}ms` }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>

          {pageCount > 1 && (
            <nav aria-label="Páginas del catálogo" className="mt-10 flex flex-wrap items-center justify-center gap-1.5">
              {currentPage > 1 && (
                <button
                  type="button"
                  onClick={() => goToPage(currentPage - 1)}
                  className="mr-1 flex items-center gap-1 rounded-card px-2 py-2 text-sm font-medium text-secondary transition-colors hover:text-primary-dark"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </button>
              )}
              {pageList(currentPage, pageCount).map((item, index) =>
                item === '…' ? (
                  <span key={`gap-${index}`} className="px-1 text-muted">
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => goToPage(item)}
                    aria-current={item === currentPage ? 'page' : undefined}
                    className={`flex h-9 min-w-9 items-center justify-center rounded-card px-2 text-sm font-semibold transition-colors ${
                      item === currentPage
                        ? 'border-2 border-primary-dark bg-white text-secondary'
                        : 'text-muted hover:text-primary-dark'
                    }`}
                  >
                    {item}
                  </button>
                ),
              )}
              {currentPage < pageCount && (
                <button
                  type="button"
                  onClick={() => goToPage(currentPage + 1)}
                  className="ml-1 flex items-center gap-1 rounded-card px-2 py-2 text-sm font-medium text-secondary transition-colors hover:text-primary-dark"
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </nav>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-card border border-dashed border-secondary/20 bg-bg-alt/60 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-primary-dark shadow-sm">
            <SearchX className="h-7 w-7" />
          </span>
          <div>
            <p className="font-semibold text-secondary">No encontramos productos</p>
            <p className="mt-1 text-sm text-muted">Prueba con otra búsqueda o quita algunos filtros.</p>
          </div>
          <button
            type="button"
            onClick={clearAll}
            className="rounded-card bg-primary-dark px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            Limpiar búsqueda y filtros
          </button>
        </div>
      )}
    </div>
  );
}
