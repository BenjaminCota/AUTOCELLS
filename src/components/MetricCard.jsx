export default function MetricCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-card border border-secondary/10 bg-white p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary-dark">
          <Icon className="h-5 w-5" />
        </span>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      </div>
      <p className="mt-3 text-2xl font-bold text-secondary">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
