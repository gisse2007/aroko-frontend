export function formatCantidad(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return "0";

  return numero.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}
