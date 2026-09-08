import { ESTADOS_LABEL } from "../../hooks/useDomicilios";
import styles from "../Detalle.module.css";

const ESTADO_CLS = {
  PENDIENTE:  styles.pendiente,
  EN_CAMINO:  styles.enCamino,
  ENTREGADO:  styles.activo,
  CANCELADO:  styles.anulada,
};

const Field = ({ label, value, full }) => (
  <div className={`${styles.fieldCard} ${full ? styles.fieldFull : ""}`}>
    <span className={styles.fieldLabel}>{label}</span>
    <span className={`${styles.fieldValue} ${!value ? styles.muted : ""}`}>
      {value || "—"}
    </span>
  </div>
);

export default function DomicilioDetalle({ domicilio }) {
  if (!domicilio) {
    return <p className={styles.notFound}>Domicilio no encontrado.</p>;
  }

  const {
    id_domicilio,
    venta_id,
    cliente_nombre,
    empleado_nombre,
    barrio,
    direccion,
    referencias,
    estado,
    created_at,
    updated_at,
  } = domicilio;

  return (
    <div className={styles.wrapper}>
      <div className={styles.topRow}>
        <span className={`${styles.badge} ${ESTADO_CLS[estado] ?? ""}`}>
          {ESTADOS_LABEL[estado] ?? estado}
        </span>

        <span className={styles.identifier}>
          #{id_domicilio}
        </span>
      </div>

      <div className={styles.fieldsGrid}>

        <Field label="Cliente"             value={cliente_nombre} full />
        <Field label="Empleado responsable" value={empleado_nombre} full />
        <Field label="Venta asociada"       value={venta_id ? `#${venta_id}` : "Sin venta"} />
        <Field label="Estado"               value={ESTADOS_LABEL[estado] ?? estado} />
        <Field label="Dirección"            value={direccion} full />
        <Field label="Barrio"               value={barrio} />
        <Field label="Referencias"          value={referencias} full />
        <Field label="Fecha de creación"    value={created_at?.split("T")[0]} />
        <Field label="Última modificación"  value={updated_at?.split("T")[0]} />

      </div>
    </div>
  );
}