const PRIMARY   = [59, 190, 218];
const SECONDARY = [208, 162, 121];

export async function generarPDFAbono(abono) {
  if (!abono) return { ok: false, error: "no_existe" };
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
    doc.text("AROKO - Comprobante de Abono", 14, 12);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`${abono.id_abono ?? "—"}  |  ${String(abono.fecha ?? "").split("T")[0] || abono.fecha || "—"}`, 14, 22);

    const color = abono.estado === "ANULADO" ? [217, 48, 37] : [26, 158, 92];
    doc.setFillColor(...color);
    doc.roundedRect(150, 6, 46, 10, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(abono.estado, 173, 12.5, { align: "center" });

    doc.setTextColor(13, 13, 13);
    let y = 36;
    const info = [
      ["N° Abono",       abono.id_abono ?? "—"],
      ["N° Venta",       abono.numero_venta ?? "—"],
      ["Cliente",        abono.cliente_nombre ?? "—"],
      ["Fecha abono",    String(abono.fecha ?? "").split("T")[0] || abono.fecha || "—"],
      ["Método de pago", abono.metodo_pago ?? "—"],
      ["Estado",         abono.estado ?? "—"],
    ];
    if (abono.observaciones) info.push(["Observaciones", abono.observaciones]);
    if (abono.motivo_anulacion) info.push(["Motivo anulación", abono.motivo_anulacion]);

    info.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold"); doc.setFontSize(9);
      doc.text(`${label}:`, 14, y);
      doc.setFont("helvetica", "normal");
      doc.text(String(value ?? "—"), 60, y);
      y += 7;
    });

    y += 4;
    autoTable(doc, {
      startY: y,
      head: [["Concepto", "Valor"]],
      body: [
        ["Saldo antes del abono",   `$${Number(abono.venta_saldo ?? 0).toLocaleString()}`],
        ["Valor abonado",           `$${Number(abono.valor ?? 0).toLocaleString()}`],
        ["Saldo después del abono", `$${Number((Number(abono.venta_saldo ?? 0) - Number(abono.valor ?? 0))).toLocaleString()}`],
      ],
      headStyles: { fillColor: PRIMARY, textColor: 255, fontStyle: "bold" },
      bodyStyles: { fontSize: 10 },
      columnStyles: { 1: { halign: "right", fontStyle: "bold" } },
      alternateRowStyles: { fillColor: [240, 251, 254] },
      margin: { left: 14, right: 14 },
    });

    const fy = doc.lastAutoTable.finalY + 8;
    doc.setFillColor(...SECONDARY);
    doc.roundedRect(120, fy - 5, 76, 10, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold"); doc.setFontSize(10);
    doc.text("Valor abonado:", 124, fy + 2);
    doc.text(`$${Number(abono.valor ?? 0).toLocaleString()}`, 193, fy + 2, { align: "right" });

    doc.setTextColor(150); doc.setFontSize(8); doc.setFont("helvetica", "normal");
    doc.text("Documento generado por Aroko", 14, 285);
    doc.text(`Generado: ${new Date().toLocaleString()}`, 130, 285);

    doc.save(`abono_${abono.id_abono ?? "documento"}.pdf`);
    return { ok: true };
  } catch {
    return { ok: false, error: "error_pdf" };
  }
}
