import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import AdminTable from '../../components/AdminTable';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import { categoryIcons, priceFormatter } from '../../components/ProductCard';
import { getAdminProducts, deleteAdminProduct } from '../../data/adminProducts';

export default function Products() {
  const [products, setProducts] = useState(() => getAdminProducts());
  const [pendingDelete, setPendingDelete] = useState(null);

  function confirmDelete() {
    deleteAdminProduct(pendingDelete.id);
    setProducts((prev) => prev.filter((product) => product.id !== pendingDelete.id));
    setPendingDelete(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-wide text-secondary sm:text-3xl">Productos</h1>
          <p className="mt-1 text-muted">{products.length} productos registrados</p>
        </div>
        <Link
          to="/admin/productos/nuevo"
          className="flex items-center gap-2 rounded-card bg-primary-dark px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          <Plus className="h-4 w-4" />
          Agregar producto
        </Link>
      </div>

      <AdminTable headers={['Producto', 'Categoría', 'Precio', 'Stock', 'Estado', 'Acciones']}>
        {products.map((product) => {
          const Icon = categoryIcons[product.category];
          return (
            <tr key={product.id}>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-card bg-bg-alt">
                    <Icon className="h-5 w-5 text-secondary/40" />
                  </span>
                  <span className="font-medium text-secondary">{product.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-secondary">{product.category}</td>
              <td className="px-4 py-3 text-secondary">{priceFormatter.format(product.price)}</td>
              <td className={`px-4 py-3 ${product.stock === 0 ? 'text-danger-dark' : 'text-secondary'}`}>
                {product.stock}
              </td>
              <td className="px-4 py-3">
                <Badge variant={product.status}>{product.status === 'nuevo' ? 'Nuevo' : 'Seminuevo'}</Badge>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
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
        <Modal title="Eliminar producto" onClose={() => setPendingDelete(null)}>
          <p className="text-secondary">
            ¿Eliminar <span className="font-semibold">{pendingDelete.name}</span>? Esta acción no se puede deshacer.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setPendingDelete(null)}
              className="rounded-card border border-secondary/20 px-4 py-2 text-sm font-semibold text-secondary transition-colors hover:border-secondary/40"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              className="rounded-card bg-danger-dark px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-danger-dark/90"
            >
              Eliminar
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
