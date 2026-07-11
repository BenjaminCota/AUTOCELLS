import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Save, FileSearch, Smartphone, Shield, BatteryCharging, Cable, Sparkles } from 'lucide-react';
import FormField from '../../components/FormField';
import Alert from '../../components/Alert';
import Modal from '../../components/Modal';
import { addAdminProduct, getAdminProduct, updateAdminProduct } from '../../data/adminProducts';

const categoryOptions = ['Celular', 'Fundas', 'Cargadores', 'Accesorios', 'Protector de pantalla'];
const statusOptions = [
  { value: 'nuevo', label: 'Nuevo' },
  { value: 'seminuevo', label: 'Seminuevo' },
];
const storageOptions = ['64GB', '128GB', '256GB', '512GB', '1TB'];
const brandOptions = [
  { value: 'iPhone', label: 'iPhone' },
  { value: 'Samsung', label: 'Samsung' },
  { value: 'Motorola', label: 'Motorola' },
  { value: 'Xiaomi', label: 'Xiaomi' },
  { value: 'Google', label: 'Google' },
  { value: 'OnePlus', label: 'OnePlus' },
  { value: 'Nokia', label: 'Nokia' },
  { value: 'Sony', label: 'Sony' },
  { value: 'Nothing', label: 'Nothing' },
  { value: 'Honor', label: 'Honor' },
];
const colorOptions = [
  { value: 'Negro', label: 'Negro' },
  { value: 'Blanco', label: 'Blanco' },
  { value: 'Azul', label: 'Azul' },
  { value: 'Rojo', label: 'Rojo' },
  { value: 'Rosa', label: 'Rosa' },
  { value: 'Verde', label: 'Verde' },
  { value: 'Naranja', label: 'Naranja' },
  { value: 'Amarillo', label: 'Amarillo' },
  { value: 'Morado', label: 'Morado' },
  { value: 'Gris', label: 'Gris' },
  { value: 'Plateado', label: 'Plateado' },
  { value: 'Dorado', label: 'Dorado' },
  { value: 'Azul Marino', label: 'Azul Marino' },
  { value: 'Titanio', label: 'Titanio' },
  { value: 'Transparente', label: 'Transparente' },
];
const chargerInputOptions = [
  { value: 'USB-C', label: 'USB-C' },
  { value: 'Lightning', label: 'Lightning' },
  { value: 'Micro USB', label: 'Micro USB' },
  { value: 'Inalámbrico', label: 'Inalámbrico' },
  { value: 'USB-A', label: 'USB-A' },
];
const screenProtectorTypeOptions = [
  { value: 'Vidrio templado', label: 'Vidrio templado' },
  { value: 'Hidrogel', label: 'Hidrogel' },
];
const privacyOptions = [
  { value: 'Sí', label: 'Sí' },
  { value: 'No', label: 'No' },
];
const caseCompatibilityOptions = [
  {
    group: 'iPhone',
    models: [
      'iPhone 12',
      'iPhone 12 Pro',
      'iPhone 12 Pro Max',
      'iPhone 13',
      'iPhone 13 Pro',
      'iPhone 13 Pro Max',
      'iPhone 14',
      'iPhone 14 Pro',
      'iPhone 14 Plus',
      'iPhone 15',
      'iPhone 15 Pro',
      'iPhone 15 Plus',
      'iPhone 15 Pro Max',
      'iPhone 16',
      'iPhone 16 Pro',
      'iPhone 16 Pro Max',
    ],
  },
  { group: 'Samsung', models: ['Samsung Galaxy S24', 'Samsung Galaxy S24 Ultra', 'Samsung Galaxy A54', 'Samsung Galaxy A25'] },
  { group: 'Otros', models: ['Motorola G84', 'Motorola Edge 40', 'Xiaomi 14', 'Xiaomi Redmi Note 13', 'Google Pixel 8', 'Google Pixel 8 Pro', 'OnePlus 12', 'Nothing Phone (2)'] },
];

const emptyForm = {
  name: '',
  category: categoryOptions[0],
  price: '',
  stock: '',
  status: 'nuevo',
  description: '',
  brand: '',
  storage: '128GB',
  color: '',
  compatibleModels: [],
  customCompatibleModel: '',
  chargerInput: '',
  screenProtectorType: '',
  privacy: '',
};

const previewIcons = {
  Celular: Smartphone,
  Fundas: Shield,
  Cargadores: BatteryCharging,
  Accesorios: Cable,
  'Protector de pantalla': Sparkles,
};

function formatCurrency(value) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function getInitialForm(existingProduct) {
  if (!existingProduct) return emptyForm;

  return {
    name: existingProduct.name ?? '',
    category: existingProduct.category === 'iPhones' ? 'Celular' : existingProduct.category ?? categoryOptions[0],
    price: existingProduct.price ?? '',
    stock: existingProduct.stock ?? '',
    status: existingProduct.status ?? 'nuevo',
    description: existingProduct.description ?? '',
    brand: existingProduct.brand ?? '',
    storage: existingProduct.storage ?? '128GB',
    color: existingProduct.color ?? '',
    compatibleModels: existingProduct.compatibleModels ?? [],
    customCompatibleModel: existingProduct.customCompatibleModel ?? '',
    chargerInput: existingProduct.chargerInput ?? '',
    screenProtectorType: existingProduct.screenProtectorType ?? '',
    privacy: existingProduct.privacy ?? '',
  };
}

export default function ProductForm() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(productId);
  const existingProduct = isEditing ? getAdminProduct(productId) : null;

  const [form, setForm] = useState(() => getInitialForm(existingProduct));
  const [photoNames, setPhotoNames] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  if (isEditing && !existingProduct) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-danger/10">
          <FileSearch className="h-8 w-8 text-danger-dark" strokeWidth={1.5} />
        </span>
        <h1 className="text-2xl font-bold text-secondary">Producto no encontrado</h1>
        <p className="max-w-prose text-muted">
          El producto que intentas editar ya no existe. Es posible que haya sido eliminado.
        </p>
        <Link to="/admin/productos" className="text-sm font-medium text-primary-dark hover:underline">
          Volver a productos
        </Link>
      </div>
    );
  }

  const isCellphoneCategory = form.category === 'Celular';
  const isCaseCategory = form.category === 'Fundas';
  const isChargerCategory = form.category === 'Cargadores';
  const isScreenProtectorCategory = form.category === 'Protector de pantalla';
  const PreviewIcon = previewIcons[form.category] ?? Smartphone;

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    setFormError('');
  }

  function handlePhotosChange(event) {
    setPhotoNames(Array.from(event.target.files).map((file) => file.name));
  }

  function validateForm() {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Ingresa el nombre del producto.';
    if (form.price === '' || Number(form.price) <= 0) errors.price = 'El precio debe ser mayor a $0.';
    if (form.stock === '' || Number(form.stock) < 0) errors.stock = 'El stock no puede ser negativo.';

    if (isCellphoneCategory) {
      if (!form.brand.trim()) errors.brand = 'Ingresa la marca del celular.';
      if (!form.color.trim()) errors.color = 'Ingresa el color del celular.';
    }

    if (isCaseCategory && form.compatibleModels.length === 0) {
      errors.compatibleModels = 'Selecciona al menos un modelo compatible.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError('Revisa los campos marcados antes de guardar.');
      return null;
    }

    return {
      name: form.name,
      category: form.category,
      price: Number(form.price),
      stock: Number(form.stock),
      status: form.status,
      description: form.description,
      ...(isCellphoneCategory ? { brand: form.brand, storage: form.storage, color: form.color } : {}),
      ...(isCaseCategory
        ? {
            color: form.color,
            compatibleModels: form.compatibleModels,
            ...(form.customCompatibleModel.trim()
              ? { customCompatibleModel: form.customCompatibleModel.trim() }
              : {}),
          }
        : {}),
      ...(isChargerCategory ? { chargerInput: form.chargerInput } : {}),
      ...(isScreenProtectorCategory ? { screenProtectorType: form.screenProtectorType, privacy: form.privacy } : {}),
    };
  }

  function handleSubmit(event) {
    event.preventDefault();
    const payload = validateForm();

    if (!payload) return;

    setShowConfirmModal(true);
  }

  function confirmSave() {
    const payload = validateForm();
    if (!payload) {
      setShowConfirmModal(false);
      return;
    }

    if (isEditing) {
      updateAdminProduct(productId, payload);
    } else {
      addAdminProduct(payload);
    }

    setShowConfirmModal(false);
    navigate('/admin/productos');
  }

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-bold uppercase tracking-wide text-secondary sm:text-3xl">
        {isEditing ? 'Editar producto' : 'Nuevo producto'}
      </h1>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 rounded-card border border-secondary/10 bg-white p-6">
          {formError && <Alert variant="error">{formError}</Alert>}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Categoría"
              id="category"
              name="category"
              select={categoryOptions}
              value={form.category}
              onChange={handleChange}
            />
            <FormField
              label="Estado"
              id="status"
              name="status"
              select={statusOptions}
              value={form.status}
              onChange={handleChange}
            />
          </div>

          <FormField
            label="Nombre"
            id="name"
            name="name"
            error={fieldErrors.name}
            value={form.name}
            onChange={handleChange}
          />

          {isCellphoneCategory ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Marca"
                  id="brand"
                  name="brand"
                  select={brandOptions}
                  error={fieldErrors.brand}
                  value={form.brand}
                  onChange={handleChange}
                />
                <FormField
                  label="Almacenamiento"
                  id="storage"
                  name="storage"
                  select={storageOptions}
                  value={form.storage}
                  onChange={handleChange}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Color"
                  id="color"
                  name="color"
                  select={colorOptions}
                  error={fieldErrors.color}
                  value={form.color}
                  onChange={handleChange}
                />
                <FormField
                  label="Precio (MXN)"
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="1"
                  error={fieldErrors.price}
                  value={form.price}
                  onChange={handleChange}
                />
              </div>
            </>
          ) : isCaseCategory ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Color"
                  id="color"
                  name="color"
                  select={colorOptions}
                  error={fieldErrors.color}
                  value={form.color}
                  onChange={handleChange}
                />
                <FormField
                  label="Precio (MXN)"
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="1"
                  error={fieldErrors.price}
                  value={form.price}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-secondary">
                  Modelos compatibles
                </label>
                <div className="max-h-64 overflow-y-auto rounded-card border border-secondary/20 bg-bg-alt p-3">
                  <div className="space-y-3">
                    {caseCompatibilityOptions.map((group) => (
                      <div key={group.group}>
                        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-secondary/70">{group.group}</p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {group.models.map((model) => {
                            const checked = form.compatibleModels.includes(model);
                            return (
                              <label key={model} className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm text-secondary shadow-sm">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => {
                                    setForm((prev) => ({
                                      ...prev,
                                      compatibleModels: checked
                                        ? prev.compatibleModels.filter((item) => item !== model)
                                        : [...prev.compatibleModels, model],
                                    }));
                                    setFieldErrors((prev) => ({ ...prev, compatibleModels: '' }));
                                  }}
                                />
                                {model}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {fieldErrors.compatibleModels && (
                  <p className="mt-1.5 text-xs font-medium text-danger-dark">{fieldErrors.compatibleModels}</p>
                )}
                <div className="mt-3 rounded-card border border-dashed border-secondary/20 bg-white p-3">
                  <label htmlFor="customCompatibleModel" className="mb-1.5 block text-sm font-medium text-secondary">
                    Otro modelo compatible
                  </label>
                  <input
                    id="customCompatibleModel"
                    name="customCompatibleModel"
                    type="text"
                    value={form.customCompatibleModel}
                    onChange={handleChange}
                    placeholder="Escribe un modelo adicional"
                    className="w-full rounded-card border border-secondary/20 bg-bg-alt px-3 py-2 text-sm text-secondary placeholder:text-muted focus:border-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-dark/20"
                  />
                </div>
              </div>
            </>
          ) : isChargerCategory ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Entrada del cargador"
                id="chargerInput"
                name="chargerInput"
                select={chargerInputOptions}
                value={form.chargerInput}
                onChange={handleChange}
              />
              <FormField
                label="Precio (MXN)"
                id="price"
                name="price"
                type="number"
                min="0"
                step="1"
                error={fieldErrors.price}
                value={form.price}
                onChange={handleChange}
              />
            </div>
          ) : isScreenProtectorCategory ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Tipo de protector"
                id="screenProtectorType"
                name="screenProtectorType"
                select={screenProtectorTypeOptions}
                value={form.screenProtectorType}
                onChange={handleChange}
              />
              <FormField
                label="Privacidad"
                id="privacy"
                name="privacy"
                select={privacyOptions}
                value={form.privacy}
                onChange={handleChange}
              />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Precio (MXN)"
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
                label="Stock"
                id="stock"
                name="stock"
                type="number"
                min="0"
                step="1"
                error={fieldErrors.stock}
                value={form.stock}
                onChange={handleChange}
              />
            </div>
          )}

          {isCellphoneCategory && (
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Stock"
                id="stock"
                name="stock"
                type="number"
                min="0"
                step="1"
                error={fieldErrors.stock}
                value={form.stock}
                onChange={handleChange}
              />
              <div className="flex items-end">
                <p className="rounded-card border border-dashed border-secondary/20 bg-bg-alt px-4 py-3 text-sm text-muted">
                  Para celulares, el precio y el stock se mostrarán directamente al cliente.
                </p>
              </div>
            </div>
          )}

          <FormField
            label="Descripción"
            id="description"
            name="description"
            textarea
            value={form.description}
            onChange={handleChange}
          />

          <div>
            <label htmlFor="photos" className="mb-1.5 block text-sm font-medium text-secondary">
              Fotos
            </label>
            <input
              id="photos"
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotosChange}
              className="block w-full text-sm text-secondary file:mr-3 file:rounded-card file:border-0 file:bg-primary-dark file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white file:transition-colors hover:file:bg-primary-hover"
            />
            {photoNames.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-2">
                {photoNames.map((name) => (
                  <li key={name} className="rounded-full bg-bg-alt px-3 py-1 text-xs text-muted">
                    {name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-2 flex justify-end gap-3">
            <Link
              to="/admin/productos"
              className="rounded-card border border-secondary/20 px-5 py-2.5 text-sm font-semibold text-secondary transition-colors hover:border-secondary/40"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-card bg-primary-dark px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              <Save className="h-4 w-4" />
              Guardar
            </button>
          </div>
        </form>

        <aside className="rounded-card border border-secondary/10 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-secondary">Vista previa para clientes</h2>
            <span className="rounded-full bg-bg-alt px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-muted">
              {form.category || 'Producto'}
            </span>
          </div>

          <div className="mt-4 overflow-hidden rounded-card border border-secondary/10 bg-bg-alt">
            <div className="relative flex aspect-square items-center justify-center bg-white/70">
              <PreviewIcon className="h-16 w-16 text-secondary/30" strokeWidth={1.5} />
              <span className="absolute left-3 top-3 rounded-full bg-primary-dark/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
                {form.status === 'nuevo' ? 'Nuevo' : 'Seminuevo'}
              </span>
            </div>
            <div className="space-y-2 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
                {form.category}
                {isCellphoneCategory && form.brand ? ` · ${form.brand}` : ''}
              </p>
              <h3 className="text-lg font-semibold text-secondary">
                {form.name || 'Nombre del producto'}
              </h3>
              <p className="text-xl font-bold text-secondary">{formatCurrency(Number(form.price) || 0)}</p>
              {(isCellphoneCategory || isCaseCategory) && (
                <div className="flex flex-wrap gap-2 text-xs text-secondary">
                  {isCellphoneCategory && form.storage && <span className="rounded-full bg-white px-2.5 py-1">{form.storage}</span>}
                  {form.color && <span className="rounded-full bg-white px-2.5 py-1">{form.color}</span>}
                  {isCaseCategory && form.compatibleModels.length > 0 && (
                    <span className="rounded-full bg-white px-2.5 py-1">{form.compatibleModels.join(', ')}</span>
                  )}
                </div>
              )}
              <p className="text-sm text-muted">
                {form.description || 'La descripción del producto aparecerá aquí para los clientes.'}
              </p>
              <button
                type="button"
                className="mt-2 w-full rounded-card bg-primary-dark px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
              >
                Ver detalle
              </button>
            </div>
          </div>
        </aside>
      </div>

      {showConfirmModal && (
        <Modal title="¿Seguro de agregar este producto?" onClose={() => setShowConfirmModal(false)}>
          <p className="text-sm text-muted">
            Revisa que la información sea correcta antes de confirmar. Esta acción agregará o actualizará el producto en el panel de administración.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowConfirmModal(false)}
              className="rounded-card border border-secondary/20 px-4 py-2 text-sm font-semibold text-secondary transition-colors hover:border-secondary/40"
            >
              Volver
            </button>
            <button
              type="button"
              onClick={confirmSave}
              className="rounded-card bg-primary-dark px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              Confirmar
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
