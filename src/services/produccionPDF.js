const PRIMARY = [59, 190, 218];
const DANGER  = [217, 48, 37];

/**
 * Normaliza la fila de producción: el listado usa `id_produccion` /
 * `empleado_nombre`, mientras el PDF espera `id` / `empleado`.
 * También garantiza que `detalle` sea un arreglo.
 */
function normalizarProduccion(raw) {
  const detalle = Array.isArray(raw?.detalle) ? raw.detalle : [];
  return {
    ...raw,
    id:       raw?.id_produccion ?? raw?.id,
    empleado: raw?.empleado_nombre ?? raw?.empleado ?? "—",
    fecha:    String(raw?.fecha ?? "").split("T")[0] || raw?.fecha || "—",
    detalle,
  };
}

export async function generarPDFProduccion(prodRaw) {
  if (!prodRaw) return { ok: false, error: "no_existe" };
  try {
    const prod = normalizarProduccion(prodRaw);

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
    doc.text("AROKO - Registro de Producción", 14, 12);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`ID: #${prod.id ?? "—"}  |  Estado: ${prod.estado ?? "—"}`, 14, 22);

    doc.setTextColor(13, 13, 13);
    let y = 36;
    const totalUnidades = prod.detalle.reduce((s, d) => s + Number(d.cantidad || 0), 0);
    const info = [
      ["Fecha producción",   prod.fecha],
      ["Empleado",           prod.empleado],
      ["Total productos",    String(prod.detalle.length)],
      ["Total unidades",     String(totalUnidades)],
      ["Estado",             prod.estado ?? "—"],
      ["Observaciones",      prod.observaciones || "—"],
    ];
    if (prod.motivo_anulacion) info.push(["Motivo anulación", prod.motivo_anulacion]);

    info.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(`${label}:`, 14, y);
      doc.setFont("helvetica", "normal");
      doc.text(String(value), 65, y);
      y += 7;
    });

    y += 4;
    if (prod.detalle.length === 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("Sin productos registrados en esta producción.", 14, y + 6);
      y += 12;
    }

    for (const item of prod.detalle) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(13, 13, 13);
      doc.text(
        `${item.producto_nombre ?? item.nombre ?? "Producto"} — ${item.cantidad} uds.`,
        14,
        y + 6
      );
      y += 4;

      // La fila del listado puede no incluir los insumos consumidos:
      // solo se dibuja la sub-tabla cuando hay datos disponibles.
      const consumidos = Array.isArray(item.insumos_consumidos) ? item.insumos_consumidos : [];
      if (consumidos.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [["Insumo", "Cant. usada", "Stock antes", "Stock después"]],
          body: consumidos.map((i) => [
            i.nombre_insumo ?? "—",
            `${i.cantidad_usada ?? "—"} ${i.unidad ?? ""}`,
            i.stock_antes ?? "—",
            i.stock_despues ?? "—",
          ]),
          headStyles: { fillColor: PRIMARY, textColor: 255, fontStyle: "bold" },
          alternateRowStyles: { fillColor: [240, 251, 254] },
          styles: { fontSize: 9 },
          margin: { left: 14, right: 14 },
        });
        y = doc.lastAutoTable.finalY + 8;
      } else {
        y += 10;
      }
    }

    // El backend devuelve el estado en mayúsculas ("ANULADA")
    const esAnulada = String(prod.estado ?? "").toUpperCase() === "ANULADA";
    if (esAnulada && prod.motivo_anulacion) {
      const fy = y + 4;
      doc.setFillColor(...DANGER);
      doc.roundedRect(14, fy, 182, 12, 3, 3, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(`ANULADA: ${prod.motivo_anulacion}`, 18, fy + 8);
    }

    doc.setTextColor(150);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Documento generado por Aroko", 14, 285);
    doc.text(`Generado: ${new Date().toLocaleString()}`, 130, 285);

    doc.save(`produccion_${prod.id ?? "detalle"}.pdf`);
    return { ok: true };
  } catch {
    return { ok: false, error: "error_pdf" };
  }
}

export async function generarPDFListaProduccion(lista) {
  if (!Array.isArray(lista) || !lista.length) return { ok: false, error: "no_existe" };
  try {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);
    const doc = new jsPDF();

    doc.setFillColor(...PRIMARY);
    doc.rect(0, 0, 210, 24, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("AROKO - Listado de Producción", 14, 16);

    autoTable(doc, {
      startY: 30,
      head: [["Fecha", "Empleado", "Productos", "Unidades", "Estado"]],
      body: lista.map((p) => {
        const norm   = normalizarProduccion(p);
        const unidades = norm.detalle.reduce((s, d) => s + Number(d.cantidad || 0), 0);
        return [
          norm.fecha,
          norm.empleado,
          `${norm.detalle.length} producto(s)`,
          unidades,
          p.estado ?? "—",
        ];
      }),
      headStyles: { fillColor: PRIMARY, textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [240, 251, 254] },
      styles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    });

    doc.setTextColor(150);
    doc.setFontSize(8);
    doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 285);
    doc.save("listado_produccion.pdf");
    return { ok: true };
  } catch {
    return { ok: false, error: "error_pdf" };
  }
}