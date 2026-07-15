// Reglas de validación de datos de entrada, COMPARTIDAS entre los formularios
// del frontend y el API (server/index.js las importa igual que slugify.js, con
// extensión .js explícita). Cada validador regresa un mensaje en español o
// null si el valor es válido: el frontend lo pinta bajo su FormField y el
// backend lo regresa como { error } con status 400 — así las dos capas dicen
// exactamente lo mismo y el backend no confía en lo que el cliente ya validó.

export const LIMITS = {
  name: { min: 3, max: 60, word: 15 },
  email: { max: 100 },
  password: { min: 6, max: 64 },
  device: { min: 3, max: 60 },
  productName: { min: 3, max: 80 },
  description: { max: 600 },
  // Las descripciones de servicio se muestran en una tarjeta de la página
  // pública, así que se acotan más corto que las de producto.
  serviceDescription: { max: 300 },
  price: { max: 1_000_000 },
  stock: { max: 9_999 },
};

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PHONE_PATTERN = /^\d{10}$/;

// Solo letras (con acentos), espacios, apóstrofes y guiones.
const NAME_CHARS_PATTERN = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ'’ -]+$/;

// Nombre de persona: se pide nombre y apellido, y ninguna "palabra" de más de
// 15 letras — es lo que corta basura tipo "weyuihruwrhiwrgwrgqqeqeh" sin
// molestar a nombres reales ("María José de la Cruz", "Jean-Pierre O'Brien").
export function validatePersonName(value) {
  const name = String(value ?? '').trim().replace(/\s+/g, ' ');
  if (!name) return 'Cuéntanos cómo te llamas.';
  if (name.length < LIMITS.name.min) return 'El nombre es demasiado corto.';
  if (name.length > LIMITS.name.max) {
    return `El nombre no puede pasar de ${LIMITS.name.max} caracteres.`;
  }
  if (!NAME_CHARS_PATTERN.test(name)) {
    return 'El nombre solo puede llevar letras, espacios, apóstrofes y guiones.';
  }
  const words = name.split(' ');
  if (words.length < 2) return 'Escribe tu nombre y apellido.';
  if (words.some((word) => word.length > LIMITS.name.word)) {
    return 'Ese nombre no parece válido. Revisa que esté bien escrito.';
  }
  return null;
}

export function validateEmail(value) {
  const email = String(value ?? '').trim().toLowerCase();
  if (!email) return 'Ingresa tu correo.';
  if (email.length > LIMITS.email.max) {
    return `El correo no puede pasar de ${LIMITS.email.max} caracteres.`;
  }
  if (!EMAIL_PATTERN.test(email)) return 'Ingresa un correo válido (ej. tu@correo.com).';
  // Mismo espíritu que el nombre de persona: cortar tecleo basura. Los correos
  // reales llevan nombres o palabras; 12+ letras seguidas con menos de 20% de
  // vocales ("tqwryutwruyqtgfytqytwrqy@...") delatan un correo inventado. Solo
  // se miran las letras de la parte local (dígitos, puntos y guiones no cuentan).
  const letters = email.slice(0, email.lastIndexOf('@')).replace(/[^a-zñ]/g, '');
  if (letters.length >= 12) {
    const vowels = (letters.match(/[aeiou]/g) ?? []).length;
    if (vowels / letters.length < 0.2) {
      return 'Ese correo parece tecleado al azar. Revisa que sea tu correo real.';
    }
  }
  return null;
}

export function validatePhone(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (!digits) return 'Ingresa tu teléfono.';
  if (!PHONE_PATTERN.test(digits)) {
    return 'Ingresa un teléfono a 10 dígitos, sin espacios ni guiones.';
  }
  // 10 veces el mismo dígito ("0000000000") no es un teléfono real.
  if (/^(\d)\1{9}$/.test(digits)) return 'Ese teléfono no parece válido.';
  return null;
}

export function validatePassword(value) {
  const password = String(value ?? '');
  if (!password) return 'Ingresa una contraseña.';
  if (password.length < LIMITS.password.min) {
    return `La contraseña debe tener al menos ${LIMITS.password.min} caracteres.`;
  }
  if (password.length > LIMITS.password.max) {
    return `La contraseña no puede pasar de ${LIMITS.password.max} caracteres.`;
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'La contraseña debe combinar letras y números.';
  }
  return null;
}

// Equipo a liberar en las citas ("iPhone 13 128GB").
export function validateDevice(value) {
  const device = String(value ?? '').trim();
  if (!device) return 'Dinos qué equipo traes (ej. iPhone 13).';
  if (device.length < LIMITS.device.min) return 'Describe tu equipo (ej. iPhone 13).';
  if (device.length > LIMITS.device.max) {
    return `El equipo no puede pasar de ${LIMITS.device.max} caracteres.`;
  }
  return null;
}

export function validateProductName(value) {
  const name = String(value ?? '').trim();
  if (!name) return 'Ingresa el nombre del producto.';
  if (name.length < LIMITS.productName.min) {
    return `El nombre debe tener al menos ${LIMITS.productName.min} caracteres.`;
  }
  if (name.length > LIMITS.productName.max) {
    return `El nombre no puede pasar de ${LIMITS.productName.max} caracteres.`;
  }
  return null;
}

// Descripciones y textos libres opcionales: solo se acota la longitud.
export function validateDescription(value, max = LIMITS.description.max) {
  if (String(value ?? '').trim().length > max) {
    return `La descripción no puede pasar de ${max} caracteres.`;
  }
  return null;
}

export function validatePrice(value, label = 'El precio') {
  const price = typeof value === 'number' ? value : Number(value);
  if (value === '' || value === null || value === undefined || Number.isNaN(price)) {
    return `${label} es obligatorio.`;
  }
  if (price <= 0) return `${label} debe ser mayor a $0.`;
  if (price > LIMITS.price.max) {
    return `${label} no puede pasar de $${LIMITS.price.max.toLocaleString('es-MX')}.`;
  }
  return null;
}

export function validateStock(value) {
  const stock = typeof value === 'number' ? value : Number(value);
  if (value === '' || value === null || value === undefined || Number.isNaN(stock)) {
    return 'Ingresa el stock.';
  }
  if (!Number.isInteger(stock)) return 'El stock debe ser un número entero.';
  if (stock < 0) return 'El stock no puede ser negativo.';
  if (stock > LIMITS.stock.max) {
    return `El stock no puede pasar de ${LIMITS.stock.max.toLocaleString('es-MX')}.`;
  }
  return null;
}
