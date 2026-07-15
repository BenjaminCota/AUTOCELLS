// Regla de negocio de garantía AUTOCELLS, centralizada para que todo el sitio
// diga lo mismo: SOLO los celulares manejan garantía (fundas, cargadores,
// audífonos y protectores se venden sin ella). Es de 1 mes, salvo los iPhone 17
// que llevan 2. El admin puede marcar un celular como "sin garantía"
// (warranty: 'No'); si el campo no existe (productos viejos o el mock estático)
// se asume que sí la tiene, igual que promete el banner de confianza del inicio.

export function warrantyMonths(product) {
  if (!product || product.category !== 'Celulares') return null;
  if (product.warranty === 'No') return null;
  return /iphone\s*17/i.test(product.name ?? '') ? 2 : 1;
}

// Etiqueta lista para mostrar ("Garantía de 1 mes" / "Garantía de 2 meses").
// Regresa null cuando el producto no maneja garantía — el consumidor decide
// si oculta la línea o muestra "Sin garantía".
export function warrantyLabel(product) {
  const months = warrantyMonths(product);
  if (months === null) return null;
  return months === 1 ? 'Garantía de 1 mes' : `Garantía de ${months} meses`;
}
