import { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Save } from 'lucide-react';
import AdminTable from '../../components/AdminTable';
import ConfirmDialog from '../../components/ConfirmDialog';
import FormField from '../../components/FormField';
import Alert from '../../components/Alert';
import { useToast } from '../../context/ToastContext';
import { addAdminService, deleteAdminService, getAdminServices, updateAdminService } from '../../data/adminServices';
import { LIMITS, validatePrice, validateDescription } from '../../lib/validation';

const emptyForm = {
  name: '',
  price: '',
  description: '',
};

export default function Services() {
  const toast = useToast();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');

  const isEditing = Boolean(editingId);

  // Los servicios se traen de la base al montar el panel.
  useEffect(() => {
    let active = true;
    getAdminServices()
      .then((list) => {
        if (active) setServices(list);
      })
      .catch(() => {
        if (active) toast.error('No se pudieron cargar los servicios. Recarga la página.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setFieldErrors({});
    setFormError('');
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    setFormError('');
  }

  function startEdit(service) {
    setEditingId(service.id);
    setForm({
      name: service.name,
      price: service.price,
      description: service.description ?? '',
    });
    setFieldErrors({});
    setFormError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving) return;

    // Mismos límites que los productos (lib/validation.js), con copy de servicio.
    const errors = {};
    const name = form.name.trim();
    if (!name) errors.name = 'Ingresa el nombre del servicio.';
    else if (name.length < LIMITS.productName.min) errors.name = `El nombre debe tener al menos ${LIMITS.productName.min} caracteres.`;
    else if (name.length > LIMITS.productName.max) errors.name = `El nombre no puede pasar de ${LIMITS.productName.max} caracteres.`;
    const priceError = validatePrice(form.price, 'El costo');
    if (priceError) errors.price = priceError;
    const descriptionError = validateDescription(form.description);
    if (descriptionError) errors.description = descriptionError;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError('Revisa los campos marcados antes de guardar.');
      return;
    }

    const payload = {
      name: form.name.trim(),
      price: Number(form.price),
      description: form.description.trim(),
    };

    setSaving(true);
    try {
      if (isEditing) {
        const updated = await updateAdminService(editingId, payload);
        setServices((prev) => prev.map((service) => (service.id === editingId ? updated : service)));
        toast.success(`Los cambios de ${updated.name} se guardaron.`);
      } else {
        const created = await addAdminService(payload);
        setServices((prev) => [created, ...prev]);
        toast.success(`${created.name} se agregó a los servicios.`);
      }
      resetForm();
    } catch {
      setFormError('No se pudo guardar el servicio. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    const target = pendingDelete;
    setPendingDelete(null);
    try {
      await deleteAdminService(target.id);
      setServices((prev) => prev.filter((service) => service.id !== target.id));
      toast.success(`${target.name} se eliminó de los servicios.`);
    } catch {
      toast.error('No se pudo eliminar el servicio. Inténtalo de nuevo.');
    }
  }

  const summary = useMemo(() => {
    if (loading) return 'Cargando servicios…';
    if (!services.length) return 'Sin servicios registrados';
    return `${services.length} servicio${services.length === 1 ? '' : 's'} registrado${services.length === 1 ? '' : 's'}`;
  }, [loading, services.length]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-wide text-secondary sm:text-3xl">Servicios</h1>
          <p className="mt-1 text-muted">{summary}</p>
        </div>
        <button
          type="button"
          onClick={resetForm}
          className="flex items-center gap-2 rounded-card bg-primary-dark px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          <Plus className="h-4 w-4" />
          {isEditing ? 'Cancelar edición' : 'Agregar servicio'}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <div className="rounded-card border border-secondary/10 bg-white p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-secondary">Servicios actuales</h2>
          <div className="mt-4">
            <AdminTable
              headers={['Servicio', 'Costo', 'Acciones']}
              emptyMessage={loading ? 'Cargando servicios…' : 'No hay servicios registrados aún.'}
            >
              {services.map((service) => (
                <tr key={service.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-secondary">{service.name}</div>
                    {service.description ? <p className="mt-1 text-sm text-muted">{service.description}</p> : null}
                  </td>
                  <td className="px-4 py-3 text-secondary">${service.price.toLocaleString('es-MX')} MXN</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => startEdit(service)}
                        aria-label={`Editar ${service.name}`}
                        className="text-secondary/60 transition-colors hover:text-primary-dark"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(service)}
                        aria-label={`Eliminar ${service.name}`}
                        className="text-secondary/60 transition-colors hover:text-danger-dark"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </AdminTable>
          </div>
        </div>

        <div className="rounded-card border border-secondary/10 bg-white p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-secondary">{isEditing ? 'Editar servicio' : 'Agregar nuevo servicio'}</h2>
          <form onSubmit={handleSubmit} noValidate className="mt-4 flex flex-col gap-4">
            {formError ? <Alert variant="error">{formError}</Alert> : null}

            <FormField
              label="Nombre del servicio"
              id="name"
              name="name"
              maxLength={LIMITS.productName.max}
              error={fieldErrors.name}
              value={form.name}
              onChange={handleChange}
            />
            <FormField
              label="Costo (MXN)"
              id="price"
              name="price"
              type="number"
              min="0"
              step="1"
              error={fieldErrors.price}
              value={form.price}
              onChange={handleChange}
            />
            <FormField
              label="Descripción"
              id="description"
              name="description"
              textarea
              maxLength={LIMITS.description.max}
              error={fieldErrors.description}
              value={form.description}
              onChange={handleChange}
            />

            <div className="mt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-card border border-secondary/20 px-4 py-2 text-sm font-semibold text-secondary transition-colors hover:border-secondary/40"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-card bg-primary-dark px-4 py-2 text-sm font-semibold text-white transition-colors enabled:hover:bg-primary-hover disabled:opacity-70"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Guardar servicio'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {pendingDelete && (
        <ConfirmDialog
          title="Eliminar servicio"
          confirmLabel="Eliminar"
          danger
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        >
          <p>
            ¿Eliminar <span className="font-semibold">{pendingDelete.name}</span>? Esta acción no se
            puede deshacer.
          </p>
        </ConfirmDialog>
      )}
    </div>
  );
}
