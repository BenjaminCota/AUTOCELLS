import { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { categories, brands, priceRanges } from '../data/products';

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
  const [mobileOpen, setMobileOpen] = useState(false);

  const groups = (
    <div className="flex flex-col gap-5 md:flex-1 md:flex-row md:flex-wrap md:gap-8">
      <ChipGroup
        label="Categoría"
        options={categories}
        value={filters.category}
        onChange={(value) => onChange('category', value)}
      />
      <ChipGroup label="Marca" options={brands} value={filters.brand} onChange={(value) => onChange('brand', value)} />
      <ChipGroup
        label="Precio"
        options={priceRanges.map((range) => range.label)}
        value={filters.price}
        onChange={(value) => onChange('price', value)}
      />
    </div>
  );

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          className="flex items-center gap-2 rounded-card border border-secondary/20 px-4 py-2 text-sm font-semibold text-secondary"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtrar
        </button>
        {hasActiveFilters && (
          <button type="button" onClick={onReset} className="text-sm font-medium text-primary-dark">
            Limpiar filtros
          </button>
        )}
      </div>

      {mobileOpen && (
        <div className="mt-4 rounded-card border border-secondary/10 bg-white p-4 md:hidden">{groups}</div>
      )}

      <div className="hidden items-start gap-6 rounded-card border border-secondary/10 bg-white p-5 md:flex">
        {groups}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary-dark"
          >
            <X className="h-4 w-4" />
            Limpiar
          </button>
        )}
      </div>
    </div>
  );
}
