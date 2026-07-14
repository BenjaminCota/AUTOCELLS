// Datos de contacto de la tienda.
export const WHATSAPP_NUMBER = '526531362027';
export const STORE_PHONE_DISPLAY = '653 136 2027';
export const STORE_ADDRESS = 'San Luis Río Colorado, Sonora, México';
// El cambio de turno entre semana también bloquea las citas (bloque de 4 a
// 5 pm en appointments.js): revisar ambos si cambia este horario.
export const STORE_HOURS_LINES = [
  'Lun–Vie: 10:00 a.m. – 8:00 p.m. (cierre de 4:30 a 5:00 p.m.)',
  'Sáb–Dom: 10:00 a.m. – 6:00 p.m.',
];
export const STORE_HOURS = STORE_HOURS_LINES.join(' · ');
export const STORE_INSTAGRAM_URL = 'https://www.instagram.com/autocellslopez';
export const STORE_FACEBOOK_URL = 'https://www.facebook.com/profile.php?id=61583954035162';
export const STORE_COORDS = { lat: 32.4508118, lng: -114.7723478 };
export const STORE_MAPS_EMBED_URL = `https://www.google.com/maps?q=${STORE_COORDS.lat},${STORE_COORDS.lng}&output=embed`;
export const STORE_MAPS_LINK = `https://www.google.com/maps?q=${STORE_COORDS.lat},${STORE_COORDS.lng}`;

export function whatsappLink(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
