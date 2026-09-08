import api from "../api/axios";

const PRIMARY = [59, 190, 218];

const money = (v) => `$${Number(v || 0).toLocaleString()}`;

/**
 * Si la fila proveniente del listado no trae el detalle (o el IVA),
 * intenta obtener la compra completa desde la API antes de generar el PDF.
 * Si la petición falla, se genera el documento con los datos disponibles.
 */
async function hidratarCompra(compra) {
  const tieneDetalle = Array.isArray(compra?.detalle) && compra.detalle.length > 0;
  if (tieneDetalle && compra.iva != null) return compra;

  const id = compra?.id_compra;
  if (!id) return compra;

  try {
    const { data: res } = await api.get(`/compras/${id}`);
    return { ...compra, ...(res?.data ?? {}) };
  } catch {
    return compra;
  }
}

export async function generarPDFCompra(compraRaw) {
  try {
    if (!compraRaw) return { ok: false, error: "no_existe" };

    const compra  = await hidratarCompra(compraRaw);
    const detalle = Array.isArray(compra.detalle) ? compra.detalle : [];
    const ivaPct  = Number(compra.iva ?? 0);

    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);
    const doc = new jsPDF();

    doc.setFillColor(...PRIMARY);
    doc.rect(0, 0, 210, 28, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("AROKO - Comprobante de Compra", 14, 12);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Factura N°: ${compra.numero_factura ?? "—"}`, 14, 22);
    doc.text(`Fecha: ${String(compra.fecha_compra ?? "").split("T")[0] || "—"}`, 120, 22);

    doc.setTextColor(13, 13, 13);
    doc.setFontSize(10);
    let y = 38;

    const info = [
      ["Proveedor",       compra.proveedor_nombre],
      ["Fecha de compra", String(compra.fecha_compra ?? "").split("T")[0] || compra.fecha_compra],
      ["N° Factura",      compra.numero_factura],
      ["Estado",          compra.estado],
      ["IVA",             `${ivaPct}%`],
    ];

    info.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, 14, y);
      doc.setFont("helvetica", "normal");
      doc.text(String(value ?? "—"), 60, y);
      y += 7;
    });

    y += 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Detalle de insumos", 14, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [["Insumo", "Unidades", "Cant. x unidad", "Unidad", "Ingresado", "Precio unit.", "Subtotal"]],
      body: detalle.length
        ? detalle.map((d) => {
            const stockIngresado = d.stock_ingresado != null
              ? Number(d.stock_ingresado)
              : Number(d.cantidad || 0) * Number(d.cantidad_por_unidad || 0);
            return [
              d.nombre_insumo ?? "—",
              d.cantidad ?? "—",
              d.cantidad_por_unidad ?? "—",
              d.unidad_medida ?? "—",
              stockIngresado ? `${stockIngresado.toLocaleString()}${d.unidad_medida ? ` ${d.unidad_medida}` : ""}` : "—",
              money(d.precio),
              money(d.subtotal ?? Number(d.precio || 0) * Number(d.cantidad || 0)),
            ];
          })
        : [["Sin detalle disponible", "—", "—", "—", "—", "—", "—"]],
      headStyles: { fillColor: PRIMARY, textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [240, 251, 254] },
      styles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    });

    const finalY   = doc.lastAutoTable.finalY + 8;
    const subtotal = detalle.reduce(
      (a, d) => a + Number((d.subtotal ?? (Number(d.precio || 0) * Number(d.cantidad || 0))) || 0),
      0
    );
    const ivaVal = subtotal * (ivaPct / 100);
    const total  = subtotal + ivaVal;

    const totales = [
      ["Subtotal",             money(subtotal)],
      [`IVA (${ivaPct}%)`,     money(ivaVal)],
      ["TOTAL",                money(total)],
    ];

    let ty = finalY;
    totales.forEach(([label, value], i) => {
      if (i === totales.length - 1) {
        doc.setFillColor(...PRIMARY);
        doc.setTextColor(255, 255, 255);
        doc.roundedRect(120, ty - 5, 76, 9, 2, 2, "F");
      } else {
        doc.setTextColor(13, 13, 13);
      }
      doc.setFont("helvetica", "bold");
      doc.text(label, 124, ty);
      doc.setFont("helvetica", "normal");
      doc.text(value, 185, ty, { align: "right" });
      ty += 10;
    });

    doc.setTextColor(150);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Documento generado por Aroko", 14, 285);
    doc.text(`Generado: ${new Date().toLocaleString()}`, 140, 285);

    doc.save(`compra_${compra.numero_factura ?? compra.id_compra ?? "detalle"}.pdf`);
    return { ok: true };
  } catch {
    return { ok: false, error: "error_pdf" };
  }
}

export async function generarPDFListaCompras(compras) {
  try {
    if (!Array.isArray(compras)) return { ok: false, error: "no_existe" };
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);
    const doc = new jsPDF();

    doc.setFillColor(...PRIMARY);
    doc.rect(0, 0, 210, 24, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.text("AROKO - Listado de Compras", 14, 16);

    autoTable(doc, {
      startY: 32,
      head: [["N° Factura", "Proveedor", "Fecha", "Total", "Estado"]],
      body: compras.map((c) => [
        c.numero_factura ?? "—",
        c.proveedor_nombre ?? "—",
        String(c.fecha_compra ?? "").split("T")[0] || c.fecha_compra || "—",
        money(c.total_compra),
        c.estado ?? "—",
      ]),
      headStyles: { fillColor: PRIMARY, textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [240, 251, 254] },
      styles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    });

    doc.setTextColor(150);
    doc.setFontSize(8);
    doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 285);

    doc.save("listado_compras.pdf");
    return { ok: true };
  } catch {
    return { ok: false, error: "error_pdf" };
  }
}