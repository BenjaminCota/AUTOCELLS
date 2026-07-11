import { useState } from 'react';
import { MapPin, Phone, Clock, MessageCircle, Send, CheckCircle2 } from 'lucide-react';
import {
  STORE_ADDRESS,
  STORE_HOURS,
  STORE_PHONE_DISPLAY,
  STORE_MAPS_EMBED_URL,
  STORE_MAPS_LINK,
  whatsappLink,
} from '../data/store';
import FormField from '../components/FormField';
import Alert from '../components/Alert';

const emptyForm = { name: '', phone: '', message: '' };
const PHONE_PATTERN = /^\d{10}$/;

export default function Contact() {
  const [form, setForm] = useState(emptyForm);
  const [submitted, setSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const errors = {};
    if (!form.name.trim()) errors.name = 'Cuéntanos cómo te llamas.';
    if (!PHONE_PATTERN.test(form.phone.replace(/\D/g, ''))) {
      errors.phone = 'Ingresa un teléfono a 10 dígitos, sin espacios ni guiones.';
    }
    if (!form.message.trim()) errors.message = 'Escribe tu mensaje para poder ayudarte.';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitted(true);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-secondary sm:text-4xl">Contacto</h1>
      <p className="mt-2 max-w-prose text-muted">
        ¿Dudas sobre un equipo o la liberación por R-SIM? Escríbenos o pasa a la tienda.
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        {/* Mapa + info */}
        <div className="flex flex-col gap-6">
          <div className="overflow-hidden rounded-card border border-secondary/10">
            <iframe
              title="Ubicación de AUTOCELLS"
              src={STORE_MAPS_EMBED_URL}
              className="h-72 w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div className="flex flex-col gap-4 rounded-card border border-secondary/10 bg-bg-alt p-6">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary-dark" />
              <div>
                <p className="text-secondary">{STORE_ADDRESS}</p>
                <a
                  href={STORE_MAPS_LINK}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-primary-dark hover:underline"
                >
                  Cómo llegar
                </a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 shrink-0 text-primary-dark" />
              <p className="text-secondary">WhatsApp: {STORE_PHONE_DISPLAY}</p>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 shrink-0 text-primary-dark" />
              <p className="text-secondary">{STORE_HOURS}</p>
            </div>

            <a
              href={whatsappLink('Hola, tengo una pregunta sobre AUTOCELLS.')}
              target="_blank"
              rel="noreferrer"
              className="mt-2 flex items-center justify-center gap-2 rounded-card bg-primary-dark px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              <MessageCircle className="h-5 w-5" />
              Preguntar por WhatsApp
            </a>
          </div>
        </div>

        {/* Formulario */}
        <div className="rounded-card border border-secondary/10 p-6">
          {submitted ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-success-dark" />
              <h2 className="text-xl font-bold text-secondary">¡Mensaje enviado!</h2>
              <p className="text-muted">Te contactaremos lo antes posible.</p>
              <button
                type="button"
                onClick={() => {
                  setForm(emptyForm);
                  setSubmitted(false);
                }}
                className="mt-2 text-sm font-medium text-primary-dark hover:underline"
              >
                Enviar otro mensaje
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              <h2 className="text-xl font-bold text-secondary">Envíanos un mensaje</h2>
              {Object.keys(fieldErrors).length > 0 && (
                <Alert variant="error">Revisa los campos marcados antes de enviar tu mensaje.</Alert>
              )}
              <FormField
                label="Nombre"
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                error={fieldErrors.name}
                value={form.name}
                onChange={handleChange}
                placeholder="Tu nombre"
              />
              <FormField
                label="Teléfono"
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                error={fieldErrors.phone}
                value={form.phone}
                onChange={handleChange}
                placeholder="653 000 0000"
              />
              <FormField
                label="Mensaje"
                id="message"
                name="message"
                textarea
                error={fieldErrors.message}
                value={form.message}
                onChange={handleChange}
                placeholder="Cuéntanos qué necesitas"
              />
              <button
                type="submit"
                className="mt-2 flex items-center justify-center gap-2 rounded-card bg-primary-dark px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
              >
                <Send className="h-4 w-4" />
                Enviar mensaje
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
