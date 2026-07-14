// Util compartido entre el frontend y el server (por eso no usa nada de Vite):
// genera ids legibles tipo "funda-magsafe" a partir del nombre.
export function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
