export async function generarPDFSalida(salida) {
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
    doc.text("AROKO - Salida de Insumos", 14, 12);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Salida #${salida.id}`, 14, 22);
    doc.text(`Fecha: ${salida.fecha}`, 140, 22);

    doc.setTextColor(13, 13, 13);
    doc.setFontSize(10);
    let y = 38;

    const empleadoNombre = salida.empleado_nombre ?? "—";

    const info = [
      ["ID Salida",   String(salida.id)],
      ["Fecha",       salida.fecha],
      ["Responsable", empleadoNombre],
      ["Estado",      salida.estado],
      ["Motivo",      salida.motivo],
    ];

    info.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, 14, y);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(String(value ?? "—"), 130);
      doc.text(lines, 55, y);
      y += lines.length > 1 ? lines.length * 6 : 7;
    });

    y += 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Detalle de insumos", 14, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [["Insumo", "Unidad", "Cantidad"]],
      body: salida.detalle.map((d) => [d.nombre_insumo, d.unidad_medida, d.cantidad]),
      headStyles: { fillColor: primary, textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [240, 251, 254] },
      styles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    });

    doc.setTextColor(150);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Documento generado por Aroko", 14, 285);
    doc.text(`Generado: ${new Date().toLocaleString()}`, 130, 285);

    doc.save(`salida_insumos_${salida.id}.pdf`);
    return true;
  } catch {
    return false;
  }
}
