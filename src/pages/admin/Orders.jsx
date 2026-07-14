import { useEffect, useState } from 'react';
import AdminTable from '../../components/AdminTable';
import Badge from '../../components/Badge';
import ConfirmDialog from '../../components/ConfirmDialog';
import { priceFormatter } from '../../components/ProductCard';
import { useToast } from '../../context/ToastContext';
import { orderStatuses, getWebOrders, updateWebOrderStatus } from '../../data/orders';
import { getAppointments } from '../../data/appointments';

export default function Orders() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [pendingCancel, setPendingCancel] = useState(null);
  // Incluye las citas que los clientes agendan desde la página de Servicios.
  const [appointments, setAppointments] = useState([]);

  // Pedidos (folios de /comprar + demo) y citas vienen de la base de datos.
  useEffect(() => {
    let active = true;
    Promise.all([getWebOrders(), getAppointments()])
      .then(([allOrders, allAppointments]) => {
        if (!active) return;
        setOrders(allOrders);
        setAppointments(allAppointments);
      })
      .catch(() => {
        if (active) toast.error('No se pudieron cargar los pedidos. Recarga la página.');
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function applyStatus(orderId, status) {
    try {
      // El cambio se guarda en la base (ej. pendiente → entregado-vendido
      // cuando el cliente paga en efectivo).
      await updateWebOrderStatus(orderId, status);
      setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status } : order)));
      if (status === 'entregado-vendido') {
        toast.success(`Pedido ${orderId} marcado como entregado-vendido.`);
      } else {
        toast.info(`Pedido ${orderId} ahora está ${status}.`);
      }
    } catch {
      toast.error('No se pudo actualizar el pedido. Inténtalo de nuevo.');
    }
  }

  function handleStatusChange(orderId, status) {
    // Cancelar es irreversible en la práctica: pedir confirmación primero.
    if (status === 'cancelado') {
      setPendingCancel(orders.find((order) => order.id === orderId));
      return;
    }
    applyStatus(orderId, status);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold uppercase tracking-wide text-secondary sm:text-3xl">Pedidos</h1>
        <p className="mt-1 text-muted">{orders.length} pedidos registrados</p>
      </div>

      <div className="rounded-card border border-secondary/10 bg-white p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-secondary">Pedidos registrados</h2>
        <div className="mt-4 overflow-x-auto">
          <AdminTable headers={['Pedido', 'Cliente', 'Productos', 'Total', 'Estado', 'Fecha']}>
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="px-4 py-3 font-medium text-secondary">{order.id}</td>
                <td className="px-4 py-3 text-secondary">{order.customer}</td>
                <td className="px-4 py-3 max-w-xs text-muted">{order.products}</td>
                <td className="px-4 py-3 text-secondary">{priceFormatter.format(order.total)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={order.status}>{order.status}</Badge>
                    <label className="sr-only" htmlFor={`status-${order.id}`}>
                      Cambiar estado de {order.id}
                    </label>
                    <select
                      id={`status-${order.id}`}
                      value={order.status}
                      onChange={(event) => handleStatusChange(order.id, event.target.value)}
                      className="rounded-card border border-secondary/20 bg-white px-2 py-1 text-xs text-secondary focus:border-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-dark/20"
                    >
                      {orderStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted">{order.date}</td>
              </tr>
            ))}
          </AdminTable>
        </div>
      </div>

      <div className="rounded-card border border-secondary/10 bg-white p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-secondary">Servicios programados</h2>
        <p className="mt-1 text-sm text-muted">Listado de citas y solicitudes de servicio con el nombre de la persona que lo agendó.</p>
        <div className="mt-4 overflow-x-auto">
          <AdminTable headers={['Cliente', 'Teléfono', 'Servicio', 'Fecha', 'Hora', 'Costo', 'Detalle']} emptyMessage="No hay servicios programados aún.">
            {appointments.map((appointment) => (
              <tr key={appointment.id}>
                <td className="px-4 py-3 font-medium text-secondary">{appointment.customerName}</td>
                <td className="px-4 py-3 text-muted">{appointment.customerPhone}</td>
                <td className="px-4 py-3 text-secondary">{appointment.serviceName}</td>
                <td className="px-4 py-3 text-secondary">{appointment.date}</td>
                <td className="px-4 py-3 text-secondary">{appointment.time}</td>
                <td className="px-4 py-3 text-secondary">{priceFormatter.format(appointment.servicePrice)}</td>
                <td className="px-4 py-3 max-w-md text-muted">{appointment.description}</td>
              </tr>
            ))}
          </AdminTable>
        </div>
      </div>

      {pendingCancel && (
        <ConfirmDialog
          title="Cancelar pedido"
          confirmLabel="Cancelar pedido"
          cancelLabel="Volver"
          danger
          onConfirm={() => {
            applyStatus(pendingCancel.id, 'cancelado');
            setPendingCancel(null);
          }}
          onCancel={() => setPendingCancel(null)}
        >
          <p>
            ¿Cancelar el pedido <span className="font-semibold">{pendingCancel.id}</span> de{' '}
            {pendingCancel.customer}? El cliente ya no podrá recogerlo.
          </p>
        </ConfirmDialog>
      )}
    </div>
  );
}
