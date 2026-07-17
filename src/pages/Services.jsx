import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Unlock,
  Smartphone,
  Settings2,
  CheckCircle2,
  CalendarClock,
  MessageCircle,
  Sun,
  Sunset,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
} from 'lucide-react';
import { getAdminServices } from '../data/adminServices';
import { getSlotsForDate, formatDateKey, addAppointment } from '../data/appointments';
import { LIMITS, validatePersonName, validatePhone, validateDevice } from '../lib/validation';
import { getCurrentUser, isAuthenticated } from '../routes/auth';
import { whatsappLink } from '../data/store';

// Foto real (Unsplash, URL verificada) para romper la monotonía de puro texto.
const SERVICE_IMAGE =
  'https://images.unsplash.com/photo-1562774555-079298a31cbe?auto=format&fit=crop&w=1100&q=80';

// Beneficios que se repiten en la tarjeta de precio y en "¿Qué es?".
const SERVICE_PERKS = ['Sin costos ocultos', 'Con garantía en el proceso', 'Listo el mismo día'];
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import Alert from '../components/Alert';

const compatibility = [
  'iPhones bloqueados por compañía (AT&T, Telcel, Movistar, Unefon)',
  'Modelos desde iPhone 7 hasta los más recientes',
  'Equipos con iOS actualizado a la última versión',
  'No aplica para equipos reportados o con bloqueo de iCloud',
];

const steps = [
  {
    number: '1',
    icon: Smartphone,
    title: 'Traes tu equipo',
    description: 'Lo revisamos sin costo para confirmar que es compatible con el servicio.',
  },
  {
    number: '2',
    icon: Settings2,
    title: 'Instalamos R-SIM',
    description: 'Configuramos el chip R-SIM para desbloquear tu equipo de la compañía.',
  },
  {
    number: '3',
    icon: CheckCircle2,
    title: 'Listo el mismo día',
    description: 'Te devolvemos tu equipo funcionando con cualquier compañía, el mismo día.',
  },
];

// Las citas se agendan con máximo un mes de anticipación.
const MAX_DAYS_AHEAD = 30;

const WEEKDAY_HEADERS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

// Celdas del mes para la cuadrícula del calendario: nulls de relleno hasta el
// día de la semana en que empieza el mes (semana iniciando en domingo).
function buildMonthCells(year, month) {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => new Date(year, month, index + 1)),
  ];
}

// Divide los slots en mañana/tarde para que la lista de horarios sea
// escaneable (con slots de 30 min son ~18 por día).
function groupSlots(slots) {
  return [
    { label: 'Mañana', icon: Sun, items: slots.filter(({ time }) => time < '14:00') },
    { label: 'Tarde', icon: Sunset, items: slots.filter(({ time }) => time >= '14:00') },
  ].filter((group) => group.items.length > 0);
}

function BookingModal({ services, initialServiceId, onClose }) {
  const toast = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  // El servicio arranca en el que se pidió desde su bloque (o el primero); el
  // usuario puede cambiarlo con el selector. El calendario es el mismo para
  // todos los servicios: un horario ocupado por cualquiera bloquea a los demás.
  const [serviceId, setServiceId] = useState(initialServiceId ?? services[0]?.id ?? '');
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [displayedMonth, setDisplayedMonth] = useState(() => {
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() };
  });
  const [time, setTime] = useState('');
  // Si hay sesión, el nombre y el teléfono se precargan desde la cuenta
  // (sesiones iniciadas antes de que la sesión guardara phone caen al '').
  const [name, setName] = useState(() => getCurrentUser()?.name ?? '');
  const [phone, setPhone] = useState(() => getCurrentUser()?.phone ?? '');
  const [device, setDevice] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [confirmed, setConfirmed] = useState(null);
  const [slotGroups, setSlotGroups] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  // Sube de versión para re-consultar horarios (ej. tras un 409 del servidor).
  const [slotsVersion, setSlotsVersion] = useState(0);

  // Los horarios ocupados se consultan a la base de datos por fecha.
  useEffect(() => {
    let active = true;
    setLoadingSlots(true);
    getSlotsForDate(selectedDate)
      .then((slots) => {
        if (active) setSlotGroups(groupSlots(slots));
      })
      .catch(() => {
        if (active) toast.error('No se pudieron cargar los horarios. Inténtalo de nuevo.');
      })
      .finally(() => {
        if (active) setLoadingSlots(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, slotsVersion]);

  const service = services.find((item) => item.id === serviceId) ?? services[0];

  // Rango agendable: de hoy a MAX_DAYS_AHEAD días. Las keys YYYY-MM-DD se
  // comparan como strings sin convertir de vuelta a Date.
  const today = new Date();
  const todayKey = formatDateKey(today);
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + MAX_DAYS_AHEAD);
  const maxKey = formatDateKey(maxDate);
  const selectedKey = formatDateKey(selectedDate);

  const monthCells = buildMonthCells(displayedMonth.year, displayedMonth.month);
  const monthLabel = new Date(displayedMonth.year, displayedMonth.month, 1).toLocaleDateString(
    'es-MX',
    { month: 'long', year: 'numeric' },
  );
  const prevDisabled =
    displayedMonth.year === today.getFullYear() && displayedMonth.month === today.getMonth();
  const nextDisabled = new Date(displayedMonth.year, displayedMonth.month + 1, 1) > maxDate;

  function shiftMonth(delta) {
    setDisplayedMonth(({ year, month }) => {
      const shifted = new Date(year, month + delta, 1);
      return { year: shifted.getFullYear(), month: shifted.getMonth() };
    });
  }

  function handleSelectDate(date) {
    setSelectedDate(date);
    // Los horarios cambian por día: la hora elegida deja de aplicar.
    setTime('');
    setFieldErrors((prev) => ({ ...prev, time: '' }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    // Reglas compartidas con el server (lib/validation.js).
    const errors = {};
    const nameError = validatePersonName(name);
    if (nameError) errors.name = nameError;
    const deviceError = validateDevice(device);
    if (deviceError) errors.device = deviceError;
    const phoneError = validatePhone(phone);
    if (phoneError) errors.phone = phoneError;
    if (!time) errors.time = 'Elige un horario disponible.';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    // El login se exige justo al confirmar: el usuario ya llenó todo. Sin
    // sesión, se le manda a iniciar sesión (la cita se liga a su cuenta).
    if (!isAuthenticated()) {
      toast.info('Inicia sesión para confirmar tu cita.');
      navigate('/login', { state: { from: { pathname: '/servicios' } } });
      return;
    }

    setSubmitting(true);
    try {
      const appointment = await addAppointment({
        customerName: name.trim(),
        customerPhone: phone.replace(/\D/g, ''),
        // El correo lo toma el server de la sesión (no viaja en el body).
        serviceName: service.name,
        servicePrice: service.price,
        device: device.trim(),
        date: formatDateKey(selectedDate),
        time,
        description: `${service.name} para ${device.trim()}, agendado desde el sitio.`,
      });
      setConfirmed(appointment);
      toast.success(`Cita agendada: ${appointment.date} a las ${appointment.time}.`);
    } catch (error) {
      if (error.status === 409) {
        // Otro cliente ganó el horario entre la carga y el envío.
        toast.error('Ese horario acaba de ocuparse. Elige otro.');
        setTime('');
        setSlotsVersion((version) => version + 1);
      } else if (error.status === 429) {
        // Límite de citas por conexión (el mensaje del server explica).
        toast.error(error.message);
      } else if (error.status === 401) {
        // La sesión expiró entre abrir el modal y confirmar.
        toast.info('Tu sesión expiró. Inicia sesión para agendar.');
        navigate('/login', { state: { from: { pathname: '/servicios' } } });
      } else {
        toast.error('No se pudo agendar la cita. Inténtalo de nuevo.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmed) {
    return (
      <Modal title="¡Cita agendada!" onClose={onClose}>
        <div className="flex flex-col items-center gap-4 text-center">
          <CheckCircle2 className="h-12 w-12 text-success-dark" />
          <div>
            <p className="font-semibold text-secondary">{confirmed.serviceName}</p>
            <p className="text-sm text-muted">{confirmed.device}</p>
            <p className="mt-1 text-sm text-muted">
              {selectedDate.toLocaleDateString('es-MX', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}{' '}
              a las {confirmed.time}
            </p>
          </div>
          <Alert variant="success">
            Te esperamos en la tienda. Si no puedes asistir, avísanos por WhatsApp.
          </Alert>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-card bg-primary-dark px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            Entendido
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Agendar una cita" onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {services.length > 1 && (
          <FormField
            label="Servicio"
            id="service"
            name="service"
            select={services.map((item) => ({ value: item.id, label: `${item.name} — $${item.price}` }))}
            value={serviceId}
            onChange={(event) => setServiceId(event.target.value)}
          />
        )}

        <div>
          <p className="mb-2 text-sm font-medium text-secondary">Día</p>
          <div className="rounded-card border border-secondary/10 p-3">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                disabled={prevDisabled}
                aria-label="Mes anterior"
                className="rounded-full p-1.5 text-secondary transition-colors enabled:hover:bg-bg-alt enabled:hover:text-primary-dark disabled:text-secondary/20"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <p className="text-sm font-semibold capitalize text-secondary">{monthLabel}</p>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                disabled={nextDisabled}
                aria-label="Mes siguiente"
                className="rounded-full p-1.5 text-secondary transition-colors enabled:hover:bg-bg-alt enabled:hover:text-primary-dark disabled:text-secondary/20"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-2 grid grid-cols-7 gap-y-1 text-center">
              {WEEKDAY_HEADERS.map((header) => (
                <span key={header} className="py-1 text-[11px] font-semibold uppercase text-muted">
                  {header}
                </span>
              ))}
              {monthCells.map((date, index) => {
                if (!date) return <span key={`empty-${index}`} />;
                const key = formatDateKey(date);
                const outOfRange = key < todayKey || key > maxKey;
                const isSelected = key === selectedKey;
                const isToday = key === todayKey;
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={outOfRange}
                    onClick={() => handleSelectDate(date)}
                    className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                      isSelected
                        ? 'bg-primary-dark font-semibold text-white shadow-md'
                        : outOfRange
                          ? 'cursor-not-allowed text-secondary/20'
                          : `text-secondary hover:bg-primary/10 hover:text-primary-dark ${
                              isToday ? 'border border-primary-dark text-primary-dark' : ''
                            }`
                    }`}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-secondary">
            Horarios disponibles ·{' '}
            <span className="capitalize">
              {selectedDate.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </p>
          {/* El servicio toma ~30 min, por eso las citas son cada media hora. */}
          <p className="mb-3 text-xs text-muted">
            La liberación toma alrededor de 30 minutos; sales con tu equipo listo el mismo día.
          </p>
          <div className="flex flex-col gap-3 rounded-card bg-bg-alt p-4">
            {loadingSlots && (
              <p className="flex items-center justify-center gap-2 py-6 text-sm text-muted">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Consultando horarios…
              </p>
            )}
            {!loadingSlots && slotGroups.map(({ label, icon: GroupIcon, items }) => (
              <div key={label}>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  <GroupIcon className="h-3.5 w-3.5" />
                  {label}
                </p>
                <div className="grid grid-cols-4 gap-1.5">
                  {items.map(({ time: slotTime, available }) => {
                    const isActive = time === slotTime;
                    return (
                      <button
                        key={slotTime}
                        type="button"
                        disabled={!available}
                        onClick={() => {
                          setTime(slotTime);
                          setFieldErrors((prev) => ({ ...prev, time: '' }));
                        }}
                        className={`rounded-full px-2 py-1.5 text-sm font-semibold transition-all duration-150 ease-snappy ${
                          isActive
                            ? 'scale-105 bg-primary-dark text-white shadow-md'
                            : available
                              ? 'bg-white text-secondary shadow-sm hover:scale-105 hover:text-primary-dark hover:shadow'
                              : 'cursor-not-allowed bg-transparent text-secondary/25'
                        }`}
                      >
                        {slotTime}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="flex items-center gap-4 border-t border-secondary/10 pt-3 text-xs text-muted">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-white shadow-sm" />
                Disponible
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full border border-secondary/20 bg-transparent" />
                Ocupado
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-primary-dark" />
                Tu cita
              </span>
            </div>
          </div>
          {fieldErrors.time && (
            <p className="mt-1.5 text-xs font-medium text-danger-dark">{fieldErrors.time}</p>
          )}
        </div>

        <FormField
          label="Nombre completo"
          id="booking-name"
          name="name"
          type="text"
          autoComplete="name"
          maxLength={LIMITS.name.max}
          error={fieldErrors.name}
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setFieldErrors((prev) => ({ ...prev, name: '' }));
          }}
          placeholder="Nombre y apellido"
        />
        <FormField
          label="Equipo a liberar"
          id="booking-device"
          name="device"
          type="text"
          maxLength={LIMITS.device.max}
          error={fieldErrors.device}
          value={device}
          onChange={(event) => {
            setDevice(event.target.value);
            setFieldErrors((prev) => ({ ...prev, device: '' }));
          }}
          placeholder="Ej. iPhone 13 128GB"
        />
        <FormField
          label="Teléfono"
          id="booking-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          maxLength={14}
          error={fieldErrors.phone}
          value={phone}
          onChange={(event) => {
            setPhone(event.target.value);
            setFieldErrors((prev) => ({ ...prev, phone: '' }));
          }}
          placeholder="653 000 0000"
        />

        {/* Aviso solo para invitados: pueden llenar todo, pero al confirmar se
            les pedirá iniciar sesión (la cita se liga a su cuenta). */}
        {!isAuthenticated() && (
          <p className="rounded-card border border-dashed border-primary-dark/25 bg-primary/5 px-4 py-2.5 text-xs text-secondary">
            Para confirmar tu cita necesitarás iniciar sesión. Llena tus datos y te llevaremos al
            paso final.
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-1 flex items-center justify-center gap-2 rounded-card bg-primary-dark px-6 py-3 text-sm font-semibold text-white transition-[background-color,transform] duration-150 ease-snappy enabled:hover:bg-primary-hover enabled:active:scale-[0.98] disabled:opacity-70"
        >
          {submitting ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Agendando cita…
            </>
          ) : (
            <>
              <CalendarClock className="h-4 w-4" />
              {isAuthenticated() ? 'Confirmar cita' : 'Continuar'}
            </>
          )}
        </button>
      </form>
    </Modal>
  );
}

export default function Services() {
  const toast = useToast();
  const [services, setServices] = useState([]);
  // El primero (R-SIM, el servicio principal) protagoniza el hero; el resto se
  // listan como bloques debajo.
  const primaryService = services[0];
  const otherServices = services.slice(1);
  const [bookingOpen, setBookingOpen] = useState(false);
  // Servicio a preseleccionar al abrir el modal (null = el primero por default).
  const [bookingServiceId, setBookingServiceId] = useState(null);

  function openBooking(serviceId = null) {
    // El modal se abre y se llena sin sesión; el login se exige al CONFIRMAR
    // (ver handleSubmit del BookingModal), no al abrir.
    setBookingServiceId(serviceId);
    setBookingOpen(true);
  }

  // Los servicios se traen de la base (antes vivían en memoria en el front).
  useEffect(() => {
    let active = true;
    getAdminServices()
      .then((list) => {
        if (active) setServices(list);
      })
      .catch(() => {
        if (active) toast.error('No se pudieron cargar los servicios.');
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:px-8">
          <div>
            <h1 className="text-3xl font-bold text-secondary sm:text-4xl lg:text-5xl">
              Liberación de celulares por R-SIM
            </h1>
            <p className="mt-4 max-w-prose text-muted">
              Si tu iPhone está bloqueado a una compañía, lo liberamos con R-SIM para que puedas usar
              cualquier chip, en México o en el extranjero. Revisión y diagnóstico sin costo.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => openBooking()}
                disabled={services.length === 0}
                className="flex items-center justify-center gap-2 rounded-card bg-primary-dark px-6 py-3.5 text-base font-semibold text-white shadow-sm transition-[background-color,transform] duration-150 ease-snappy enabled:hover:bg-primary-hover enabled:active:scale-[0.98] disabled:opacity-70"
              >
                <CalendarClock className="h-5 w-5" />
                {services.length === 0 ? 'Cargando servicios…' : 'Agendar una cita'}
              </button>
              <a
                href={whatsappLink('Hola, quiero liberar mi iPhone por R-SIM.')}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-card border border-secondary/20 px-6 py-3.5 text-base font-semibold text-secondary transition-colors hover:border-primary-dark hover:text-primary-dark"
              >
                <MessageCircle className="h-5 w-5" />
                WhatsApp
              </a>
            </div>
          </div>

          {/* Tarjeta de precio: encabezado cian, precio grande y checklist. */}
          <div className="overflow-hidden rounded-card border border-secondary/10 bg-white shadow-[0_24px_60px_-28px_rgba(14,116,144,0.5)]">
            <div className="bg-primary-dark px-6 py-5 text-center text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/80">
                Liberación por R-SIM
              </p>
              <p className="mt-1 text-5xl font-bold">
                ${primaryService?.price ?? 300}
                <span className="ml-1 text-lg font-semibold text-white/80">MXN</span>
              </p>
            </div>
            <div className="flex flex-col gap-4 p-6">
              <ul className="flex flex-col gap-2.5">
                {SERVICE_PERKS.map((perk) => (
                  <li key={perk} className="flex items-center gap-2 text-sm text-secondary">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-success-dark" />
                    {perk}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => openBooking()}
                disabled={services.length === 0}
                className="flex items-center justify-center gap-2 rounded-card bg-primary-dark px-5 py-3 text-sm font-semibold text-white transition-[background-color,transform] duration-150 ease-snappy enabled:hover:bg-primary-hover enabled:active:scale-[0.98] disabled:opacity-70"
              >
                <CalendarClock className="h-4 w-4" />
                Agendar
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Qué es — panel con gradiente azul, foto real del chip y beneficios. */}
      <section className="bg-gradient-to-br from-primary-dark to-primary-hover text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="overflow-hidden rounded-card bg-white/10 shadow-lg ring-1 ring-white/15">
            <img
              src={SERVICE_IMAGE}
              alt="Chip R-SIM que se coloca junto a la tarjeta SIM del iPhone para liberarlo"
              loading="lazy"
              className="aspect-[4/3] h-full w-full object-cover"
            />
          </div>
          <div>
            <span className="flex h-14 w-14 items-center justify-center rounded-card bg-white/15">
              <Unlock className="h-7 w-7 text-white" strokeWidth={1.75} />
            </span>
            <h2 className="mt-5 text-2xl font-bold sm:text-3xl">¿Qué es la liberación por R-SIM?</h2>
            <p className="mt-4 text-white/85">
              R-SIM es un chip que se coloca junto a la tarjeta SIM de tu iPhone y engaña al sistema
              para que acepte señal de cualquier compañía. Es una solución externa: no se abre ni se
              modifica el equipo por dentro.
            </p>
            <ul className="mt-6 flex flex-col gap-3">
              {['Compatible con cualquier compañía', 'Seguro: no se abre el equipo', 'Sin perder la garantía'].map(
                (perk) => (
                  <li key={perk} className="flex items-center gap-3 font-medium">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-white" />
                    {perk}
                  </li>
                ),
              )}
            </ul>
          </div>
        </div>
      </section>

      {/* Compatibilidad — checklist en dos columnas para llenar el ancho y no
          dejar tanto vacío a los lados. */}
      <section className="bg-bg-alt">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-secondary">Compatibilidad</h2>
          <ul className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-2">
            {compatibility.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-card border border-secondary/10 bg-white p-4 text-sm text-secondary"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success-dark" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Proceso — los 3 pasos conectados con una línea horizontal (en desktop)
          para que se lea como una secuencia, no como íconos sueltos. */}
      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-secondary">Cómo funciona</h2>
          <div className="relative mt-10 grid gap-8 sm:grid-cols-3">
            {/* Línea conectora entre los centros del primer y último ícono. */}
            <div
              className="pointer-events-none absolute left-[16.66%] right-[16.66%] top-8 hidden h-0.5 bg-primary-dark/20 sm:block"
              aria-hidden="true"
            />
            {steps.map(({ number, icon: Icon, title, description }) => (
              <div key={number} className="relative flex flex-col items-center gap-3 text-center">
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary-dark text-white ring-8 ring-white">
                  <Icon className="h-7 w-7" strokeWidth={1.75} />
                  <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-bold text-white">
                    {number}
                  </span>
                </div>
                <h3 className="font-semibold text-secondary">{title}</h3>
                <p className="max-w-xs text-sm text-muted">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Otros servicios: los que el admin agrega además del R-SIM. Cada uno
          muestra su descripción (antes invisible para el cliente) y agenda con
          el MISMO calendario compartido. */}
      {otherServices.length > 0 && (
        <section className="bg-bg-alt">
          <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
            <h2 className="text-center text-2xl font-bold text-secondary">Otros servicios</h2>
            <p className="mt-2 text-center text-muted">
              Además de la liberación por R-SIM, en AUTOCELLS también te ofrecemos:
            </p>
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {otherServices.map((svc) => (
                <div
                  key={svc.id}
                  className="flex flex-col rounded-card border border-secondary/10 bg-white p-6 transition-[transform,border-color,box-shadow] duration-200 ease-snappy hover:-translate-y-1 hover:border-primary-dark/25 hover:shadow-[0_18px_38px_-20px_rgba(14,116,144,0.4)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold text-secondary">{svc.name}</h3>
                    <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary-dark">
                      ${svc.price.toLocaleString('es-MX')} MXN
                    </span>
                  </div>
                  {svc.description && <p className="mt-3 text-sm text-muted">{svc.description}</p>}
                  <button
                    type="button"
                    onClick={() => openBooking(svc.id)}
                    className="mt-6 flex items-center justify-center gap-2 self-start rounded-card bg-primary-dark px-5 py-2.5 text-sm font-semibold text-white transition-[background-color,transform] duration-150 ease-snappy hover:bg-primary-hover active:scale-[0.98]"
                  >
                    <CalendarClock className="h-4 w-4" />
                    Agendar cita
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA final de cierre de venta: gradiente cian (distinto del footer
          oscuro) con acción principal (agendar) y secundaria (WhatsApp). */}
      <section className="bg-gradient-to-br from-primary-dark to-primary-hover">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
            ¿Listo para liberar tu iPhone?
          </h2>
          <p className="max-w-prose text-white/85">
            Agenda tu cita hoy mismo y sal el mismo día con tu equipo funcionando en cualquier
            compañía.
          </p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => openBooking()}
              disabled={services.length === 0}
              className="flex items-center justify-center gap-2 rounded-card bg-white px-7 py-3.5 text-base font-semibold text-primary-dark shadow-sm transition-transform duration-150 ease-snappy enabled:hover:-translate-y-0.5 enabled:active:scale-95 disabled:opacity-70"
            >
              <CalendarClock className="h-5 w-5" />
              Agendar ahora
            </button>
            <a
              href={whatsappLink('Hola, quiero agendar la liberación de mi iPhone por R-SIM.')}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-card border border-white/40 px-7 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/10"
            >
              <MessageCircle className="h-5 w-5" />
              WhatsApp
            </a>
          </div>
        </div>
      </section>

      {bookingOpen && (
        <BookingModal
          services={services}
          initialServiceId={bookingServiceId}
          onClose={() => setBookingOpen(false)}
        />
      )}
    </div>
  );
}
