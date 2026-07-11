const fieldClass =
  'w-full rounded-card border border-secondary/20 bg-white px-4 py-2.5 text-sm text-secondary placeholder:text-muted transition-colors focus:border-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-dark/20';

const errorFieldClass =
  'border-danger-dark focus:border-danger-dark focus:ring-danger-dark/20';

export default function FormField({ label, id, textarea = false, select, error, className = '', ...props }) {
  const errorId = error ? `${id}-error` : undefined;
  const stateClass = error ? errorFieldClass : '';

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-secondary">
        {label}
      </label>
      {select ? (
        <select
          id={id}
          className={`${fieldClass} ${stateClass} ${className}`}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          {...props}
        >
          {select.map((option) => {
            const value = typeof option === 'string' ? option : option.value;
            const optionLabel = typeof option === 'string' ? option : option.label;
            return (
              <option key={value} value={value}>
                {optionLabel}
              </option>
            );
          })}
        </select>
      ) : textarea ? (
        <textarea
          id={id}
          className={`${fieldClass} min-h-[120px] resize-y ${stateClass} ${className}`}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          {...props}
        />
      ) : (
        <input
          id={id}
          className={`${fieldClass} ${stateClass} ${className}`}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          {...props}
        />
      )}
      {error && (
        <p id={errorId} className="mt-1.5 text-xs font-medium text-danger-dark">
          {error}
        </p>
      )}
    </div>
  );
}
