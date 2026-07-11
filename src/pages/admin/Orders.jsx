import { useState } from 'react';
import AdminTable from '../../components/AdminTable';
import Badge from '../../components/Badge';
import { priceFormatter } from '../../components/ProductCard';
import { orders as initialOrders, orderStatuses } from '../../data/orders';
import { getAdminServices } from '../../data/adminServices';

const scheduledServiceAppointments = [
  {
    id: 'apt-rsim-1',
    customerName: 'Ana Torres',
    serviceName: 'Liberación de celulares por R-SIM',
    servicePrice: 300,
    appointmentTime: '09:30',
    description: 'Cita para liberar iPhone 13 con R-SIM.',
  },
  {
    id: 'apt-rsim-2',
    customerName: 'Luis Medina',
    serviceName: 'Liberación de celulares por R-SIM',
    servicePrice: 300,
    appointmentTime: '11:00',
    description: 'Cliente con equipo Samsung para liberación.',
  },
  {
    id: 'apt-service-1',
    customerName: 'Martha López',
    serviceName: 'Cambio de pantalla',
    servicePrice: 1200,
    appointmentTime: '14:15',
    description: 'Servicio pendiente para reparación.',
  },
];

export default function Orders() {
  const [orders, setOrders] = useState(initialOrders);
  const scheduledServices = getAdminServices();

  function handleStatusChange(orderId, status) {
    setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status } : order)));
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
          <AdminTable headers={['Cliente', 'Servicio', 'Hora', 'Costo', 'Detalle']} emptyMessage="No hay servicios programados aún.">
            {scheduledServiceAppointments.map((appointment) => (
              <tr key={appointment.id}>
                <td className="px-4 py-3 font-medium text-secondary">{appointment.customerName}</td>
                <td className="px-4 py-3 text-secondary">{appointment.serviceName}</td>
                <td className="px-4 py-3 text-secondary">{appointment.appointmentTime}</td>
                <td className="px-4 py-3 text-secondary">{priceFormatter.format(appointment.servicePrice)}</td>
                <td className="px-4 py-3 max-w-md text-muted">{appointment.description}</td>
              </tr>
            ))}
          </AdminTable>
        </div>
      </div>
    </div>
  );
}
