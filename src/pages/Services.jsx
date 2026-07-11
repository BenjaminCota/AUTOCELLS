import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Unlock, Smartphone, Settings2, CheckCircle2, MessageCircle } from 'lucide-react';
import { whatsappLink } from '../data/store';
import { getAdminServices } from '../data/adminServices';

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

export default function Services() {
  const services = useMemo(() => getAdminServices(), []);
  const primaryService = services[0];
  const whatsappHref = whatsappLink('Hola, quiero información sobre el servicio de liberación por R-SIM.');

  return (
    <div>
      {/* Hero */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
          <div>
            <h1 className="text-3xl font-bold text-secondary sm:text-4xl">Liberación de celulares por R-SIM</h1>
            <p className="mt-4 max-w-prose text-muted">
              Si tu iPhone está bloqueado a una compañía, lo liberamos con R-SIM para que puedas usar
              cualquier chip, en México o en el extranjero. Revisión y diagnóstico sin costo.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-card bg-primary-dark px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-primary-hover"
              >
                <MessageCircle className="h-5 w-5" />
                Preguntar por WhatsApp
              </a>
              <Link
                to="/contacto"
                className="flex items-center justify-center gap-2 rounded-card border border-secondary/20 px-6 py-3.5 text-base font-semibold text-secondary transition-colors hover:border-primary-dark hover:text-primary-dark"
              >
                Ir a Contacto
              </Link>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 rounded-card bg-bg-alt p-10 text-center">
            <Unlock className="h-14 w-14 text-primary-dark" strokeWidth={1.5} />
            <p className="text-sm font-semibold uppercase tracking-wide text-muted">Precio único</p>
            <p className="text-5xl font-bold text-secondary">${primaryService?.price ?? 300}</p>
            <p className="text-sm text-muted">MXN, sin costos ocultos</p>
          </div>
        </div>
      </section>

      {/* Qué es */}
      <section className="bg-bg-alt">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-secondary">¿Qué es la liberación por R-SIM?</h2>
          <p className="mt-4 text-muted">
            R-SIM es un chip que se coloca junto a la tarjeta SIM de tu iPhone y engaña al sistema para que
            acepte señal de cualquier compañía. Es una solución de software y hardware externa: no se abre
            ni se modifica el equipo por dentro, así que no pierde la garantía física.
          </p>
        </div>
      </section>

      {/* Compatibilidad */}
      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-secondary">Compatibilidad</h2>
          <ul className="mt-6 space-y-3">
            {compatibility.map((item) => (
              <li key={item} className="flex items-start gap-3 text-secondary">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success-dark" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Proceso */}
      <section className="bg-bg-alt">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-secondary">Cómo funciona</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {steps.map(({ number, icon: Icon, title, description }) => (
              <div key={number} className="flex flex-col items-center gap-3 text-center">
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary-dark text-white">
                  <Icon className="h-7 w-7" strokeWidth={1.75} />
                  <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-bold text-white">
                    {number}
                  </span>
                </div>
                <h3 className="font-semibold text-secondary">{title}</h3>
                <p className="text-sm text-muted">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-secondary">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white">¿Tienes dudas sobre tu equipo?</h2>
          <p className="text-white/80">Escríbenos y te decimos si tu iPhone es compatible antes de que vengas.</p>
          <Link
            to="/contacto"
            className="rounded-card bg-primary-dark px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            Contáctanos
          </Link>
        </div>
      </section>
    </div>
  );
}
