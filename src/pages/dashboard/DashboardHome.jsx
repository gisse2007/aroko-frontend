import { useState, useEffect, useCallback, useMemo } from "react";
import { FiShoppingBag, FiShoppingCart, FiClipboard, FiRefreshCw } from "react-icons/fi";
import KpiPeriodCard   from "../../components/dashboard/KpiPeriodCard";
import TopProductsCard from "../../components/dashboard/TopProductsCard";
import StockAlertCard  from "../../components/dashboard/StockAlertCard";
import OrdersTable     from "../../components/dashboard/OrdersTable";
import KpiCard         from "../../components/dashboard/KpiCard";
import api             from "../../api/axios";
import styles from "./DashboardHome.module.css";

const EMPTY_KPI = { semana: { value: "—", change: "0%" }, mes: { value: "—", change: "0%" }, año: { value: "—", change: "0%" } };
const EMPTY_ORD = { semana: { value: 0, change: "0%" }, mes: { value: 0, change: "0%" }, año: { value: 0, change: "0%" } };

export default function DashboardHome() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data: res } = await api.get("/dashboard");
      setData(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || "Error al cargar el dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const salesData     = useMemo(() => data?.salesData     ?? EMPTY_KPI, [data?.salesData]);
  const purchasesData = useMemo(() => data?.purchasesData ?? EMPTY_KPI, [data?.purchasesData]);
  const ordersData    = useMemo(() => data?.ordersData    ?? EMPTY_ORD, [data?.ordersData]);
  const topProducts   = useMemo(() => data?.topProducts   ?? [],       [data?.topProducts]);
  const stockAlerts   = useMemo(() => data?.stockAlerts   ?? [],       [data?.stockAlerts]);
  const recentOrders  = useMemo(() => data?.recentOrders  ?? [],       [data?.recentOrders]);
  const resumen       = useMemo(() => data?.resumen       ?? {},       [data?.resumen]);

  return (
    <div className={styles.page}>

      {/* ── Barra superior: resumen rápido ── */}
      <div className={styles.resumeRow}>
        <KpiCard title="Clientes activos"   value={resumen.clientes_activos   ?? "—"} />
        <KpiCard title="Productos activos"  value={resumen.productos_activos  ?? "—"} />
        <KpiCard title="Pedidos en curso"   value={resumen.pedidos_en_curso   ?? "—"} accent />
        <KpiCard title="Ventas hoy"         value={resumen.ventas_hoy         ?? "—"} />
        <KpiCard title="Ingresos del mes"   value={resumen.ingresos_mes
          ? `$${Math.round(resumen.ingresos_mes).toLocaleString("es-CO")}`
          : "—"} accent />
      </div>

      {error && (
        <div className={styles.errorBanner}>
          {error}
          <button onClick={load} className={styles.retryBtn}>
            <FiRefreshCw /> Reintentar
          </button>
        </div>
      )}

      {/* ── KPIs periódicos ── */}
      <section className={styles.kpiGrid}>
        <KpiPeriodCard title="Ventas"   icon={<FiShoppingBag />}  data={salesData}     loading={loading} />
        <KpiPeriodCard title="Compras"  icon={<FiShoppingCart />} data={purchasesData} loading={loading} />
        <KpiPeriodCard title="Pedidos"  icon={<FiClipboard />}    data={ordersData}    loading={loading} />
      </section>

      {/* ── Productos + Alertas ── */}
      <section className={styles.midGrid}>
        <TopProductsCard products={topProducts} loading={loading} />
        <StockAlertCard  items={stockAlerts}    loading={loading} />
      </section>

      {/* ── Tabla de pedidos recientes ── */}
      <section>
        <OrdersTable orders={recentOrders} loading={loading} />
      </section>

    </div>
  );
}
