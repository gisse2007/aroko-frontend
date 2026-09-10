// src/layouts/SplitAuthLayout.jsx
import styles from "./SplitAuthLayout.module.css";

/**
 * Layout de pantalla partida para Login y Registro.
 * - Panel izquierdo: fotografía gourmet de panadería/repostería.
 * - Panel derecho: formulario sobre fondo crema.
 *
 * Props:
 *   image    {string}  URL de Unsplash (ya incluye auto=format para AVIF/WebP)
 *   tagline  {string}  Texto secundario sobre la imagen (opcional)
 *   children           Contenido del formulario
 */
export default function SplitAuthLayout({
  image,
  tagline = "Sabor que enamora",
  children,
}) {
  return (
    <div className={styles.wrapper}>
      {/* ── Panel izquierdo: imagen ── */}
      <div className={styles.imgPanel} aria-hidden="true">
        <img
          src={image}
          alt=""
          className={styles.bgImg}
          loading="eager"
          decoding="async"
          width="900"
          height="1200"
        />
        <div className={styles.imgOverlay} />
        <div className={styles.imgContent}>
          <p className={styles.panelTagline}>{tagline}</p>
        </div>
      </div>

      {/* ── Panel derecho: formulario ── */}
      <div className={styles.formPanel}>
        <div className={styles.formCard}>
          {children}
        </div>
      </div>
    </div>
  );
}

