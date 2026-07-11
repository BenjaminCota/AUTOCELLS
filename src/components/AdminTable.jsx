export default function AdminTable({ headers, children, emptyMessage = 'Sin resultados.' }) {
  const rows = Array.isArray(children) ? children.filter(Boolean) : children;
  const hasRows = Array.isArray(rows) ? rows.length > 0 : Boolean(rows);

  return (
    <div className="overflow-x-auto rounded-card border border-secondary/10 bg-white">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-secondary/10 bg-bg-alt text-xs font-semibold uppercase tracking-wide text-muted">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-4 py-3 font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-secondary/10">
          {hasRows ? (
            rows
          ) : (
            <tr>
              <td colSpan={headers.length} className="px-4 py-10 text-center text-muted">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
