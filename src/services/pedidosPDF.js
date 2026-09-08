const PRIMARY    = [59, 190, 218];
const SECONDARY  = [208, 162, 121];

const ESTADO_COLOR = {
  Entregado:              [26, 158, 92],
  Aceptado:               [26, 158, 92],
  Inactivo:               [217, 48, 37],
  Rechazado:              [217, 48, 37],
  "En espera de fecha":   [230, 168, 23],
  "Con fecha asignada":   [59, 190, 218],
  Activo:                 [59, 190, 218],
};

export async function generarPDFPedido(pedido) {
  if (!pedido) return { ok: false, error: "no_existe" };
  try {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);
    const doc = new jsPDF();

    doc.setFillColor(...PRIMARY);
    doc.rect(0, 0, 210, 28, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.text("AROKO - Comprobante de Pedido", 14, 12);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`N° ${pedido.numero_pedido}  |  ${pedido.fecha_pedido}`, 14, 22);

    const estadoColor = ESTADO_COLOR[pedido.estado] ?? [100, 100, 100];
    doc.setFillColor(...estadoColor);
    doc.roundedRect(150, 6, 46, 10, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(pedido.estado, 173, 12.5, { align: "center" });

    doc.setTextColor(13, 13, 13);
    let y = 36;
    const info = [
      ["Cliente",          pedido.cliente],
      ["Teléfono",         pedido.telefono || "—"],
      ["Fecha pedido",     pedido.fecha_pedido],
      ["Fecha entrega",    pedido.fecha_entrega || "—"],
      ["Registrado por",   pedido.created_by],
      ["Estado",           pedido.estado],
    ];
    if (pedido.observaciones) info.push(["Observaciones", pedido.observaciones]);

    info.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(`${label}:`, 14, y);
      doc.setFont("helvetica", "normal");
      doc.text(String(value), 60, y);
      y += 7;
    });

    y += 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(13, 13, 13);
    doc.text("Detalle del pedido", 14, y);
    y += 3;

    autoTable(doc, {
      startY: y,
      head: [["Producto", "Cantidad", "Precio unit.", "Subtotal"]],
      body: pedido.detalle.map((d) => [
        d.nombre,
        d.cantidad,
        `$${Number(d.precio).toLocaleString()}`,
        `$${Number(d.subtotal).toLocaleString()}`,
      ]),
      headStyles: { fillColor: PRIMARY, textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [240, 251, 254] },
      styles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    });

    const fy = doc.lastAutoTable.finalY + 8;
    doc.setFillColor(...SECONDARY);
    doc.roundedRect(120, fy - 5, 76, 10, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("TOTAL:", 124, fy + 2);
    doc.text(`$${Number(pedido.total).toLocaleString()}`, 193, fy + 2, { align: "right" });

    doc.setTextColor(150);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Documento generado por Aroko", 14, 285);
    doc.text(`Generado: ${new Date().toLocaleString()}`, 130, 285);

    doc.save(`pedido_${pedido.numero_pedido}.pdf`);
    return { ok: true };
  } catch {
    return { ok: false, error: "error_pdf" };
  }
}
