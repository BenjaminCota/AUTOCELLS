import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, Package, ClipboardList, Unlock } from 'lucide-react';
import { priceFormatter } from '../../components/ProductCard';
import MetricCard from '../../components/MetricCard';
import AdminTable from '../../components/AdminTable';
import Badge from '../../components/Badge';
import { useToast } from '../../context/ToastContext';
import { getAdminProducts } from '../../data/adminProducts';
import { getWebOrders } from '../../data/orders';
import { getAppointments, formatDateKey } from '../../data/appointments';

export default function Dashboard() {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [appointments, setAppointments] = useState([]);

  // Pedidos, citas y productos vienen de la base de datos; todas las métricas
  // se derivan de ahí (nada hardcodeado).
  useEffect(() => {
    let active = true;
    Promise.all([getWebOrders(), getAppointments(), getAdminProducts()])
      .then(([ordersData, appointmentsData, productsData]) => {
        if (!active) return;
        setAllOrders(ordersData);
        setProducts(productsData);
        // Próximas primero.
        setAppointments(
          [...appointmentsData].sort((a, b) =>
            `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`),
          ),
        );
      })
      .catch(() => {
        if (active) toast.error('No se pudo cargar el resumen. Recarga la página.');
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fecha local (no toISOString, que es UTC y cambia de día a las 5pm aquí).
  const todayStr = formatDateKey(new Date());
  const monthKey = todayStr.slice(0, 7);

  const productsInStock = products.filter((product) => product.stock > 0).length;
  const pendingOrders = allOrders.filter((order) => order.status === 'pendiente').length;
  const monthSales = allOrders
    .filter((order) => order.status === 'entregado-vendido' && order.date.startsWith(monthKey))
    .reduce((sum, order) => sum + order.total, 0);
  // Liberaciones realizadas: citas de R-SIM de este mes cuya fecha ya pasó.
  const completedUnlocks = appointments.filter(
    (appointment) =>
      appointment.serviceName.toLowerCase().includes('liberación') &&
      appointment.date.startsWith(monthKey) &&
      appointment.date <= todayStr,
  ).length;
  const recentOrders = allOrders.slice(0, 5);

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
        <MetricCard icon={Unlock} label="Liberaciones realizadas" value={completedUnlocks} hint="Este mes" />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-secondary">Citas agendadas</h2>
          <span className="text-sm text-muted">{appointments.length} citas</span>
        </div>
        <AdminTable
          headers={['Cliente', 'Teléfono', 'Servicio', 'Fecha', 'Hora', 'Costo']}
          emptyMessage="No hay citas agendadas aún."
        >
          {appointments.map((appointment) => (
            <tr key={appointment.id}>
              <td className="px-4 py-3 font-medium text-secondary">{appointment.customerName}</td>
              <td className="px-4 py-3 text-muted">{appointment.customerPhone}</td>
              <td className="px-4 py-3 text-secondary">{appointment.serviceName}</td>
              <td className="px-4 py-3 text-secondary">{appointment.date}</td>
              <td className="px-4 py-3 text-secondary">{appointment.time}</td>
              <td className="px-4 py-3 text-secondary">{priceFormatter.format(appointment.servicePrice)}</td>
            </tr>
          ))}
        </AdminTable>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-secondary">Últimos pedidos</h2>
          <Link to="/admin/pedidos" className="text-sm font-medium text-primary-dark hover:underline">
            Ver todos
          </Link>
        </div>
        <AdminTable
          headers={['Pedido', 'Cliente', 'Total', 'Estado', 'Fecha']}
          emptyMessage="Aún no hay pedidos."
        >
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
