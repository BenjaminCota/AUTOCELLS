// Cliente del API de citas (server/index.js + SQLite). Las citas demo viven
// como seeds de la base; el cálculo de slots sigue aquí porque es lógica de
// presentación (los horarios de la tienda), pero los horarios ocupados se
// consultan al servidor.
import { apiUrl } from '../lib/api';
import { authHeaders } from '../routes/auth';

// Bloques donde se aceptan citas (inicio incluido, fin excluido, en minutos
// del día), definidos por la tienda para respetar su horario y el cambio de
// turno: L–V de 10:00 a 16:00 y de 17:00 a 20:00 (16:00–17:00 no se agenda);
// S–D solo de 10:00 a 17:00. Mantener en sync con STORE_HOURS de store.js.
const WEEKDAY_BLOCKS = [
  { start: 10 * 60, end: 16 * 60 },
  { start: 17 * 60, end: 20 * 60 },
];
const WEEKEND_BLOCKS = [{ start: 10 * 60, end: 17 * 60 }];

export function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Sin filtros exige sesión: el server decide qué regresar según el token
// (admin = todas; cliente = solo las suyas). Con ?date= es público, pero solo
// regresa los horarios ocupados ({time}), sin datos de clientes.
export async function getAppointments({ date } = {}) {
  const query = date ? `?date=${encodeURIComponent(date)}` : '';
  const response = await fetch(apiUrl(`citas${query}`), { headers: authHeaders() });
  if (!response.ok) throw new Error('Error al consultar las citas');
  return response.json();
}

// Lanza Error con status 409 adjunto si el horario ya está ocupado.
export async function addAppointment(data) {
  const response = await fetch(apiUrl('citas'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = new Error('No se pudo agendar la cita');
    error.status = response.status;
    throw error;
  }
  return response.json();
}

// Slots de 30 minutos (la liberación por R-SIM es rápida) dentro de los
// bloques del día, marcando los no disponibles: ya reservados en la base, o
// ya pasados si la fecha es hoy.
export async function getSlotsForDate(date) {
  const dateKey = formatDateKey(date);
  const booked = await getAppointments({ date: dateKey });
  const bookedTimes = new Set(booked.map((appointment) => appointment.time));

  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  const blocks = isWeekend ? WEEKEND_BLOCKS : WEEKDAY_BLOCKS;

  const now = new Date();
  const isToday = dateKey === formatDateKey(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const slots = [];
  for (const { start, end } of blocks) {
    for (let minutes = start; minutes < end; minutes += 30) {
      const hour = Math.floor(minutes / 60);
      const minute = minutes % 60;
      const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      const isPast = isToday && minutes <= nowMinutes;
      slots.push({ time, available: !bookedTimes.has(time) && !isPast });
    }
  }
  return slots;
}
