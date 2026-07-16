const variants = {
  nuevo: 'bg-primary/10 text-primary-dark',
  seminuevo: 'bg-secondary/10 text-secondary',
  disponible: 'bg-success/10 text-success-dark',
  agotado: 'bg-danger/10 text-danger-dark',
  pendiente: 'bg-primary/10 text-primary-dark',
  'entregado-vendido': 'bg-success/10 text-success-dark',
  cancelado: 'bg-danger/10 text-danger-dark',
  // Estados de cita: realizada (concluida) y cancelada.
  realizada: 'bg-success/10 text-success-dark',
  cancelada: 'bg-danger/10 text-danger-dark',
};

export default function Badge({ variant = 'nuevo', children }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${variants[variant] ?? variants.nuevo}`}
    >
      {children}
    </span>
  );
}
