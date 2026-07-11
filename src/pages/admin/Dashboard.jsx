import { Link } from 'react-router-dom';
import { DollarSign, Package, ClipboardList, Unlock } from 'lucide-react';
import { priceFormatter } from '../../components/ProductCard';
import MetricCard from '../../components/MetricCard';
import AdminTable from '../../components/AdminTable';
import Badge from '../../components/Badge';
import { getAdminProducts } from '../../data/adminProducts';
import { orders } from '../../data/orders';

const weeklySales = [
  { label: 'Lun', value: 4200 },
  { label: 'Mar', value: 6800 },
  { label: 'Mié', value: 3900 },
  { label: 'Jue', value: 9100 },
  { label: 'Vie', value: 12400 },
  { label: 'Sáb', value: 15600 },
  { label: 'Dom', value: 5200 },
];

export default function Dashboard() {
  const adminProducts = getAdminProducts();
  const productsInStock = adminProducts.filter((product) => product.stock > 0).length;
  const pendingOrders = orders.filter((order) => order.status === 'pendiente').length;
  const monthSales = orders
    .filter((order) => order.status === 'entregado')
    .reduce((sum, order) => sum + order.total, 0);
  const maxSale = Math.max(...weeklySales.map((day) => day.value));
  const recentOrders = orders.slice(0, 5);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold uppercase tracking-wide text-secondary sm:text-3xl">Dashboard</h1>
        <p className="mt-1 text-muted">Resumen de la tienda.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={DollarSign} label="Ventas del mes" value={priceFormatter.format(monthSales)} />
        <MetricCard icon={Package} label="Productos en stock" value={productsInStock} />
        <MetricCard icon={ClipboardList} label="Pedidos pendientes" value={pendingOrders} />
        <MetricCard icon={Unlock} label="Liberaciones realizadas" value={18} hint="Este mes" />
      </div>

      <div className="rounded-card border border-secondary/10 bg-white p-6">
        <h2 className="text-lg font-bold text-secondary">Ventas de la semana</h2>
        <div className="mt-6 flex h-40 items-end gap-3">
          {weeklySales.map((day) => (
            <div
              key={day.label}
              className="w-full flex-1 rounded-t-card bg-primary-dark"
              style={{ height: `${Math.max((day.value / maxSale) * 100, 4)}%` }}
              title={priceFormatter.format(day.value)}
            />
          ))}
        </div>
        <div className="mt-2 flex gap-3">
          {weeklySales.map((day) => (
            <span key={day.label} className="flex-1 text-center text-xs text-muted">
              {day.label}
            </span>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-secondary">Últimos pedidos</h2>
          <Link to="/admin/pedidos" className="text-sm font-medium text-primary-dark hover:underline">
            Ver todos
          </Link>
        </div>
        <AdminTable headers={['Pedido', 'Cliente', 'Total', 'Estado', 'Fecha']}>
          {recentOrders.map((order) => (
            <tr key={order.id}>
              <td className="px-4 py-3 font-medium text-secondary">{order.id}</td>
              <td className="px-4 py-3 text-secondary">{order.customer}</td>
              <td className="px-4 py-3 text-secondary">{priceFormatter.format(order.total)}</td>
              <td className="px-4 py-3">
                <Badge variant={order.status}>{order.status}</Badge>
              </td>
              <td className="px-4 py-3 text-muted">{order.date}</td>
            </tr>
          ))}
        </AdminTable>
      </div>
    </div>
  );
}
