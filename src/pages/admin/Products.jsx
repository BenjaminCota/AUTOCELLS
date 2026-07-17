import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Smartphone, Star, HandCoins } from 'lucide-react';
import AdminTable from '../../components/AdminTable';
import Badge from '../../components/Badge';
import ConfirmDialog from '../../components/ConfirmDialog';
import { categoryIcons, priceFormatter } from '../../components/ProductCard';
import { useToast } from '../../context/ToastContext';
import { getAdminProducts, deleteAdminProduct, setAdminProductFeatured, sellAdminProduct } from '../../data/adminProducts';
import { statusLabel } from '../../data/products';

// Mismo orden que regresa el API: el destacado anclado arriba, luego por fecha.
// Se replica aquí para reacomodar la lista al destacar sin volver a pedirla.
function sortFeaturedFirst(list) {
  return [...list].sort(
    (a, b) => Number(b.featured) - Number(a.featured) || b.createdAt.localeCompare(a.createdAt),
  );
}

export default function Products() {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [pendingSale, setPendingSale] = useState(null);
  const [selling, setSelling] = useState(false);

  useEffect(() => {
    let active = true;
    getAdminProducts()
      .then((data) => active && setProducts(data))
      .catch(() => active && toast.error('No se pudieron cargar los productos. Recarga la página.'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggleFeatured(product) {
    const featured = !product.featured;
    try {
      await setAdminProductFeatured(product.id, featured);
      // Solo puede haber un destacado: marcar este desmarca cualquier otro.
      setProducts((prev) =>
        sortFeaturedFirst(prev.map((p) => ({ ...p, featured: featured && p.id === product.id }))),
      );
      toast.success(
        featured
          ? `${product.name} ahora aparece destacado en el inicio.`
          : `${product.name} ya no aparece destacado en el inicio.`,
      );
    } catch {
      toast.error('No se pudo actualizar el producto destacado. Inténtalo de nuevo.');
    }
  }

  async function confirmDelete() {
    const target = pendingDelete;
    setPendingDelete(null);
    try {
      await deleteAdminProduct(target.id);
      setProducts((prev) => prev.filter((product) => product.id !== target.id));
      toast.success(`${target.name} se eliminó del catálogo.`);
    } catch {
      toast.error(`No se pudo eliminar ${target.name}. Inténtalo de nuevo.`);
    }
  }

  // Venta de mostrador: baja 1 del stock y registra la venta (el server la
  // deja como pedido entregado-vendido, así el dashboard la suma).
  async function confirmSale() {
    if (selling) return;
    const target = pendingSale;
    setSelling(true);
    try {
      const { stock } = await sellAdminProduct(target.id);
      setProducts((prev) => prev.map((product) => (product.id === target.id ? { ...product, stock } : product)));
      toast.success(`Venta registrada: ${target.name}. Quedan ${stock} en stock.`);
      setPendingSale(null);
    } catch (error) {
      toast.error(error.status === 409 ? error.message : 'No se pudo registrar la venta. Inténtalo de nuevo.');
      setPendingSale(null);
    } finally {
      setSelling(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-wide text-secondary sm:text-3xl">Productos</h1>
          <p className="mt-1 text-muted">
            {loading
              ? 'Cargando…'
              : `${products.length} productos registrados. Usa la estrella para anclar el destacado que aparece en el inicio.`}
          </p>
        </div>
        <Link
          to="/admin/productos/nuevo"
          className="flex items-center gap-2 rounded-card bg-primary-dark px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          <Plus className="h-4 w-4" />
          Agregar producto
        </Link>
      </div>

      <AdminTable
        headers={['Producto', 'Categoría', 'Precio', 'Stock', 'Estado', 'Acciones']}
        emptyMessage={loading ? 'Cargando productos…' : 'Aún no hay productos. Agrega el primero.'}
      >
        {products.map((product) => {
          // Fallback a Smartphone: los productos creados desde el admin no traen
          // imagen y su categoría podría no estar en el mapa de íconos.
          const Icon = categoryIcons[product.category] ?? Smartphone;
          return (
            <tr key={product.id} className={product.featured ? 'bg-primary/5' : undefined}>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-card bg-bg-alt">
                    {product.image ? (
                      <img src={product.image} alt="" className="h-full w-full object-contain p-1" />
                    ) : (
                      <Icon className="h-5 w-5 text-secondary/40" />
                    )}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-secondary">{product.name}</span>
                    {product.featured && (
                      <span className="inline-flex w-fit items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary-dark">
                        <Star className="h-3 w-3 fill-current" />
                        Aparece en el inicio
                      </span>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-secondary">{product.category}</td>
              <td className="px-4 py-3 text-secondary">{priceFormatter.format(product.price)}</td>
              <td className={`px-4 py-3 ${product.stock === 0 ? 'text-danger-dark' : 'text-secondary'}`}>
                {product.stock}
              </td>
              <td className="px-4 py-3">
                <Badge variant={product.status}>{statusLabel(product.status)}</Badge>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    aria-label={
                      product.featured
                        ? `Quitar ${product.name} del inicio`
                        : `Destacar ${product.name} en el inicio`
                    }
                    title={product.featured ? 'Quitar del inicio' : 'Destacar en el inicio'}
                    onClick={() => toggleFeatured(product)}
                    className={
                      product.featured
                        ? 'text-primary-dark'
                        : 'text-secondary/60 transition-colors hover:text-primary-dark'
                    }
                  >
                    <Star className={`h-4 w-4 ${product.featured ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Registrar venta de ${product.name}`}
                    title={product.stock === 0 ? 'Sin stock' : 'Registrar venta en tienda (baja 1 del stock)'}
                    onClick={() => setPendingSale(product)}
                    disabled={product.stock === 0}
                    className="text-secondary/60 transition-colors enabled:hover:text-success-dark disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <HandCoins className="h-4 w-4" />
                  </button>
                  <Link
                    to={`/admin/productos/${product.id}/editar`}
                    aria-label={`Editar ${product.name}`}
                    className="text-secondary/60 transition-colors hover:text-primary-dark"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    aria-label={`Eliminar ${product.name}`}
                    onClick={() => setPendingDelete(product)}
                    className="text-secondary/60 transition-colors hover:text-danger-dark"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </AdminTable>

      {pendingDelete && (
        <ConfirmDialog
          title="Eliminar producto"
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

      {pendingSale && (
        <ConfirmDialog
          title="Registrar venta en tienda"
          confirmLabel={selling ? 'Registrando…' : 'Registrar venta'}
          onConfirm={confirmSale}
          onCancel={() => (selling ? null : setPendingSale(null))}
        >
          <p>
            ¿Registrar la venta de <span className="font-semibold">{pendingSale.name}</span> por{' '}
            {priceFormatter.format(pendingSale.price)}? Bajará 1 del stock (quedarán{' '}
            {pendingSale.stock - 1}) y se sumará a las ventas del mes.
          </p>
        </ConfirmDialog>
      )}
    </div>
  );
}
