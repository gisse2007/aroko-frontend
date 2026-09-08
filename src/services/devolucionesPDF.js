export async function generarPDFDevolucion(dev) {
  try {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);
    const doc = new jsPDF();
    const primary = [59, 190, 218];

    doc.setFillColor(...primary);
    doc.rect(0, 0, 210, 28, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("AROKO - Comprobante de Devolución", 14, 12);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Pedido: ${dev.pedido_id}`, 14, 22);
    doc.text(`Fecha: ${dev.fecha}`, 130, 22);

    doc.setTextColor(13, 13, 13);
    doc.setFontSize(10);
    let y = 38;

    const empleadoNombre = dev.empleado_nombre ?? "—";

    const info = [
      ["Pedido ID",  dev.pedido_id],
      ["Fecha",      dev.fecha],
      ["Empleado",   empleadoNombre],
      ["Estado",     dev.estado],
      ["Motivo",     dev.motivo],
    ];

    info.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, 14, y);
      doc.setFont("helvetica", "normal");
      doc.text(String(value ?? "—"), 55, y);
      y += 7;
    });

    y += 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Detalle de productos", 14, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [["Producto", "Cantidad", "Precio unit.", "Subtotal"]],
      body: dev.detalle.map((d) => [
        d.nombre_producto,
        d.cantidad,
        `$${Number(d.precio).toLocaleString()}`,
        `$${Number(d.subtotal).toLocaleString()}`,
      ]),
      headStyles: { fillColor: primary, textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [240, 251, 254] },
      styles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    });

    const finalY = doc.lastAutoTable.finalY + 8;
    doc.setFillColor(...primary);
    doc.setTextColor(255, 255, 255);
    doc.roundedRect(120, finalY - 5, 76, 9, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL", 124, finalY);
    doc.setFont("helvetica", "normal");
    doc.text(`$${Number(dev.total).toLocaleString()}`, 185, finalY, { align: "right" });

    doc.setTextColor(150);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Documento generado por Aroko", 14, 285);
    doc.text(`Generado: ${new Date().toLocaleString()}`, 130, 285);

    doc.save(`devolucion_${dev.pedido_id}_${dev.id}.pdf`);
    return true;
  } catch {
    return false;
  }
}
