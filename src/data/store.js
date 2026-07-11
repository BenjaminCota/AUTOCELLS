// Datos de contacto de la tienda. Placeholder hasta tener los datos reales.
export const WHATSAPP_NUMBER = '526530000000';
export const STORE_PHONE_DISPLAY = '(653) 000-0000';
export const STORE_ADDRESS = 'San Luis Río Colorado, Sonora, México';
export const STORE_HOURS = 'Lun–Vie 10:00–20:00 (cambio de turno 4:30–5:00 pm) · Sáb–Dom 10:00–18:00';
export const STORE_INSTAGRAM_URL = 'https://www.instagram.com/autocellslopez';
export const STORE_COORDS = { lat: 32.4508118, lng: -114.7723478 };
export const STORE_MAPS_EMBED_URL = `https://www.google.com/maps?q=${STORE_COORDS.lat},${STORE_COORDS.lng}&output=embed`;
export const STORE_MAPS_LINK = `https://www.google.com/maps?q=${STORE_COORDS.lat},${STORE_COORDS.lng}`;

export function whatsappLink(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
