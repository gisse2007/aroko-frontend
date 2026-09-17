import { useEffect, useRef, useState } from "react";
import { FiBell, FiShield, FiPackage, FiInfo, FiCheck } from "react-icons/fi";
import { useNotificaciones } from "../../hooks/useNotificaciones";
import styles from "./NotificationBell.module.css";

const ICONS = {
  SEGURIDAD: FiShield,
  PEDIDO:    FiPackage,
  INFO:      FiInfo,
};

function formatFecha(fecha) {
  if (!fecha) return "";
  const d = new Date(fecha);
  const ahora = new Date();
  const diffMs = ahora - d;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Hace un momento";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Hace ${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `Hace ${diffD} d`;
  return d.toLocaleDateString("es-CO");
}

export default function NotificationBell() {
  const { data, noLeidas, marcarLeida, marcarTodasLeidas } = useNotificaciones();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className={styles.wrap} ref={ref}>
      <button
        type="button"
        className={styles.bellBtn}
        onClick={() => setOpen((o) => !o)}
        aria-label="Notificaciones"
      >
        <FiBell />
        {noLeidas > 0 && <span className={styles.badge}>{noLeidas > 9 ? "9+" : noLeidas}</span>}
      </button>

      {open && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span>Notificaciones</span>
            {noLeidas > 0 && (
              <button type="button" className={styles.markAllBtn} onClick={marcarTodasLeidas}>
                <FiCheck /> Marcar todas como leídas
              </button>
            )}
          </div>

          <div className={styles.panelBody}>
            {data.length === 0 ? (
              <p className={styles.empty}>No tienes notificaciones.</p>
            ) : (
              data.map((n) => {
                const Icon = ICONS[n.tipo] ?? FiInfo;
                return (
                  <button
                    type="button"
                    key={n.id_notificacion}
                    className={`${styles.item} ${n.leida ? "" : styles.itemUnread}`}
                    onClick={() => !n.leida && marcarLeida(n.id_notificacion)}
                  >
                    <span className={`${styles.itemIcon} ${styles[`icon_${n.tipo}`] ?? ""}`}>
                      <Icon />
                    </span>
                    <span className={styles.itemBody}>
                      <span className={styles.itemTitle}>{n.titulo}</span>
                      {n.mensaje && <span className={styles.itemMsg}>{n.mensaje}</span>}
                      <span className={styles.itemFecha}>{formatFecha(n.created_at)}</span>
                    </span>
                    {!n.leida && <span className={styles.dot} />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
