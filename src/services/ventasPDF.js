const PRIMARY   = [59, 190, 218];
const SECONDARY = [208, 162, 121];

export async function generarPDFVenta(venta) {
  if (!venta) return { ok: false, error: "no_existe" };
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
    doc.text("AROKO - Comprobante de Venta", 14, 12);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`${venta.numero_venta}  |  ${venta.fecha_venta}`, 14, 22);

    const color = venta.estado === "Anulada" ? [217, 48, 37] : [26, 158, 92];
    doc.setFillColor(...color);
    doc.roundedRect(150, 6, 46, 10, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(venta.estado, 173, 12.5, { align: "center" });

    doc.setTextColor(13, 13, 13);
    let y = 36;
    const info = [
      ["N° Venta",  venta.numero_venta],
      ["Cliente",   venta.cliente_nombre],
      ["Fecha",     venta.fecha_venta],
      ["Estado",    venta.estado],
    ];
    if (venta.motivo_anulacion) info.push(["Motivo anulación", venta.motivo_anulacion]);

    info.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold"); doc.setFontSize(9);
      doc.text(`${label}:`, 14, y);
      doc.setFont("helvetica", "normal");
      doc.text(String(value ?? "—"), 55, y);
      y += 7;
    });

    y += 4;
    doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(13, 13, 13);
    doc.text("Detalle de productos", 14, y);
    y += 3;

    autoTable(doc, {
      startY: y,
      head: [["Producto", "Cantidad", "Precio unit.", "Subtotal"]],
      body: venta.detalle.map((d) => [
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
    doc.setFont("helvetica", "bold"); doc.setFontSize(10);
    doc.text("TOTAL:", 124, fy + 2);
    doc.text(`$${Number(venta.total).toLocaleString()}`, 193, fy + 2, { align: "right" });

    doc.setTextColor(150); doc.setFontSize(8); doc.setFont("helvetica", "normal");
    doc.text("Documento generado por Aroko", 14, 285);
    doc.text(`Generado: ${new Date().toLocaleString()}`, 130, 285);

    doc.save(`venta_${venta.numero_venta}.pdf`);
    return { ok: true };
  } catch {
    return { ok: false, error: "error_pdf" };
  }
}
