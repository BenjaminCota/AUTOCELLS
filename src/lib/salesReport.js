// Reporte financiero mensual en PDF para el admin. Las cifras se derivan de los
// pedidos (misma fuente que el dashboard): SOLO cuentan como venta los pedidos
// en estado 'entregado-vendido' (pagados al recoger en tienda); los pendientes
// y cancelados no suman. jsPDF se importa de forma diferida (solo al descargar)
// para no cargar la librería en el bundle principal del sitio.

const MXN = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 2,
});

function currency(value) {
  return MXN.format(value || 0);
}

// 'YYYY-MM' → "Julio 2026" (con mayúscula inicial). Se construye la fecha con
// componentes locales para que la zona horaria no la mueva al mes anterior.
function monthLabelFromKey(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, (month || 1) - 1, 1);
  const label = new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

// Calcula el resumen del mes a partir de los pedidos ya cargados.
export function computeMonthlyReport(orders, monthKey) {
  const sales = orders
    .filter((order) => order.status === 'entregado-vendido' && String(order.date).startsWith(monthKey))
    .sort((a, b) => String(a.date).localeCompare(String(b.date)) || String(a.id).localeCompare(String(b.id)));

  const totalRevenue = sales.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
  const count = sales.length;
  const avgTicket = count ? totalRevenue / count : 0;

  // Unidades e ingreso por producto. El ingreso por renglón sale de `subtotal`
  // (pedidos web); las ventas en tienda son de una pieza y su ingreso es el
  // total del pedido.
  const byProductMap = new Map();
  let unitsSold = 0;
  for (const order of sales) {
    const items = Array.isArray(order.items) ? order.items : [];
    const singleItem = items.length === 1;
    for (const item of items) {
      const qty = Number(item.qty) || 0;
      unitsSold += qty;
      const revenue =
        typeof item.subtotal === 'number' ? item.subtotal : singleItem ? Number(order.total) || 0 : 0;
      const key = item.name || 'Producto';
      const entry = byProductMap.get(key) || { name: key, qty: 0, revenue: 0 };
      entry.qty += qty;
      entry.revenue += revenue;
      byProductMap.set(key, entry);
    }
  }
  const byProduct = [...byProductMap.values()].sort((a, b) => b.revenue - a.revenue);

  return {
    monthKey,
    monthLabel: monthLabelFromKey(monthKey),
    sales,
    totalRevenue,
    count,
    avgTicket,
    unitsSold,
    byProduct,
  };
}

// Genera y descarga el PDF del mes indicado (monthKey 'YYYY-MM').
export async function downloadMonthlySalesReport(orders, monthKey) {
  const report = computeMonthlyReport(orders, monthKey);
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 40;
  const BRAND = [14, 116, 144]; // --color-primary-dark
  const INK = [88, 89, 91]; // --color-secondary
  const MUTED = [107, 109, 111]; // --color-muted

  // --- Encabezado con banda de marca ---
  doc.setFillColor(...BRAND);
  doc.rect(0, 0, pageWidth, 92, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('AUTOCELLS', marginX, 42);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.text('Reporte de ventas del mes', marginX, 62);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(report.monthLabel, marginX, 80);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const generated = `Generado el ${new Intl.DateTimeFormat('es-MX', { dateStyle: 'long' }).format(new Date())}`;
  doc.text(generated, pageWidth - marginX, 80, { align: 'right' });

  // --- Tarjetas de resumen (KPIs) ---
  const kpis = [
    { label: 'Ingresos del mes', value: currency(report.totalRevenue) },
    { label: 'Ventas concretadas', value: String(report.count) },
    { label: 'Ticket promedio', value: currency(report.avgTicket) },
    { label: 'Unidades vendidas', value: String(report.unitsSold) },
  ];
  const gap = 12;
  const cardW = (pageWidth - marginX * 2 - gap * (kpis.length - 1)) / kpis.length;
  const cardY = 116;
  const cardH = 62;
  kpis.forEach((kpi, index) => {
    const x = marginX + index * (cardW + gap);
    doc.setFillColor(245, 247, 248); // --color-bg-alt
    doc.roundedRect(x, cardY, cardW, cardH, 6, 6, 'F');
    doc.setTextColor(...MUTED);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(kpi.label.toUpperCase(), x + 10, cardY + 22);
    doc.setTextColor(...BRAND);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text(kpi.value, x + 10, cardY + 46);
  });

  let y = cardY + cardH + 28;

  if (report.count === 0) {
    doc.setTextColor(...INK);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text('No hubo ventas concretadas en este mes.', marginX, y);
  } else {
    // --- Detalle de ventas ---
    doc.setTextColor(...INK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Detalle de ventas', marginX, y);
    autoTable(doc, {
      startY: y + 10,
      head: [['Folio', 'Fecha', 'Cliente', 'Artículos', 'Total']],
      body: report.sales.map((order) => [
        order.id,
        order.date,
        order.customer,
        order.products || '—',
        currency(order.total),
      ]),
      styles: { fontSize: 9, cellPadding: 5, textColor: INK, overflow: 'linebreak' },
      headStyles: { fillColor: BRAND, textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 251] },
      columnStyles: {
        0: { cellWidth: 92 },
        1: { cellWidth: 62 },
        4: { halign: 'right', cellWidth: 70 },
      },
      margin: { left: marginX, right: marginX },
    });
    y = doc.lastAutoTable.finalY + 26;

    // --- Ventas por producto ---
    doc.setTextColor(...INK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Ventas por producto', marginX, y);
    autoTable(doc, {
      startY: y + 10,
      head: [['Producto', 'Unidades', 'Ingreso']],
      body: report.byProduct.map((entry) => [entry.name, String(entry.qty), currency(entry.revenue)]),
      foot: [['Total', String(report.unitsSold), currency(report.totalRevenue)]],
      styles: { fontSize: 9, cellPadding: 5, textColor: INK, overflow: 'linebreak' },
      headStyles: { fillColor: BRAND, textColor: [255, 255, 255], fontStyle: 'bold' },
      footStyles: { fillColor: [245, 247, 248], textColor: INK, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 251] },
      columnStyles: {
        1: { halign: 'right', cellWidth: 80 },
        2: { halign: 'right', cellWidth: 90 },
      },
      margin: { left: marginX, right: marginX },
    });
    y = doc.lastAutoTable.finalY + 20;
  }

  // --- Nota metodológica + numeración, en cada página ---
  const pageCount = doc.internal.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(230, 233, 235);
    doc.line(marginX, pageHeight - 46, pageWidth - marginX, pageHeight - 46);
    doc.setTextColor(...MUTED);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(
      'Solo se cuentan pedidos entregados y pagados en tienda. Pedidos pendientes o cancelados no se incluyen.',
      marginX,
      pageHeight - 32,
    );
    doc.text(`Página ${page} de ${pageCount}`, pageWidth - marginX, pageHeight - 32, { align: 'right' });
  }

  doc.save(`reporte-ventas-${monthKey}.pdf`);
  return report;
}
