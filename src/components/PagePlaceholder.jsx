export default function PagePlaceholder({ title, description }) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 px-4 py-24 text-center">
      <span className="rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-primary-dark">
        Próximamente
      </span>
      <h1 className="text-3xl font-bold uppercase tracking-wide text-secondary sm:text-4xl">
        {title}
      </h1>
      {description && <p className="text-muted">{description}</p>}
    </div>
  );
}
