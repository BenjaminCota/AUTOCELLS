import { useMemo, useState } from 'react';
import { SlidersHorizontal, ChevronDown, X } from 'lucide-react';
import { categories, priceRanges, productStatuses, useCatalog } from '../data/products';

const STORAGE_ORDER = ['64GB', '128GB', '256GB', '512GB', '1TB'];

function distinct(values) {
  return [...new Set(values.filter(Boolean))];
}

// Grupos de filtro por categoría, espejo de los campos condicionales del
// formulario de producto del admin (ProductForm.jsx). Las opciones se derivan
// de los productos existentes para no ofrecer filtros sin resultados.
const contextualGroupDefs = {
  Celulares: [
    { key: 'brand', label: 'Marca', getOptions: (items) => distinct(items.map((p) => p.brand)).sort() },
    {
      key: 'storage',
      label: 'Almacenamiento',
      getOptions: (items) => STORAGE_ORDER.filter((size) => items.some((p) => p.storage?.includes(size))),
    },
    {
      key: 'color',
      label: 'Color',
      getOptions: (items) => distinct(items.flatMap((p) => p.colors ?? [])).sort((a, b) => a.localeCompare(b, 'es')),
    },
  ],
  Fundas: [
    {
      key: 'color',
      label: 'Color',
      getOptions: (items) => distinct(items.flatMap((p) => p.colors ?? [])).sort((a, b) => a.localeCompare(b, 'es')),
    },
    {
      key: 'compatibleModel',
      label: 'Compatible con',
      getOptions: (items) => distinct(items.flatMap((p) => p.compatibleModels ?? [])).sort(),
    },
  ],
  Cargadores: [
    { key: 'chargerInput', label: 'Entrada', getOptions: (items) => distinct(items.map((p) => p.chargerInput)).sort() },
  ],
  'Protector de pantalla': [
    {
      key: 'protectorType',
      label: 'Tipo de protector',
      getOptions: (items) => distinct(items.map((p) => p.screenProtectorType)).sort(),
    },
    { key: 'privacy', label: 'Privacidad', getOptions: () => ['Sí', 'No'] },
  ],
};

function ChipGroup({ label, options, value, onChange }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isActive = value === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-primary-dark bg-primary-dark text-white'
                  : 'border-secondary/20 text-secondary hover:border-primary-dark hover:text-primary-dark'
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function CatalogFilters({ filters, onChange, onReset, hasActiveFilters }) {
  const { products } = useCatalog();
  // Cerrado por defecto: las opciones solo se muestran al presionar "Filtrar".
  const [open, setOpen] = useState(false);

  // Todos los defaults son 'Todos', así que contar activos es directo.
  const activeCount = Object.values(filters).filter((value) => value !== 'Todos').length;

  const contextualGroups = useMemo(() => {
    const defs = contextualGroupDefs[filters.category];
    if (!defs) return [];
    const inCategory = products.filter((product) => product.category === filters.category);
    return defs
      .map(({ key, label, getOptions }) => ({ key, label, options: getOptions(inCategory) }))
      .filter((group) => group.options.length > 1);
  }, [filters.category, products]);

  return (
    <div className="mb-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          className={`flex items-center gap-2 rounded-card border px-4 py-2 text-sm font-semibold transition-colors ${
            open || hasActiveFilters
              ? 'border-primary-dark text-primary-dark'
              : 'border-secondary/20 text-secondary hover:border-primary-dark hover:text-primary-dark'
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtrar
          {activeCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-dark px-1.5 text-xs font-bold text-white">
              {activeCount}
            </span>
          )}
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ease-snappy ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 text-sm font-medium text-primary-dark hover:underline"
          >
            <X className="h-4 w-4" />
            Limpiar filtros
          </button>
        )}
      </div>

      {open && (
        <div className="mt-3 flex flex-col gap-5 rounded-card border border-secondary/10 bg-white p-5 md:flex-row md:flex-wrap md:gap-8">
          <ChipGroup
            label="Categoría"
            options={categories}
            value={filters.category}
            onChange={(value) => onChange('category', value)}
          />
          <ChipGroup
            label="Estado"
            options={['Todos', ...productStatuses.map((option) => option.label)]}
            value={filters.status}
            onChange={(value) => onChange('status', value)}
          />
          <ChipGroup
            label="Precio"
            options={priceRanges.map((range) => range.label)}
            value={filters.price}
            onChange={(value) => onChange('price', value)}
          />
          {contextualGroups.map(({ key, label, options }) => (
            <ChipGroup
              key={key}
              label={label}
              options={['Todos', ...options]}
              value={filters[key]}
              onChange={(value) => onChange(key, value)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
