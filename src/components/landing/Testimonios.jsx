import { useState } from "react";
import { FiSend, FiStar } from "react-icons/fi";
import styles from "./Testimonios.module.css";

const TESTIMONIOS = [
  {
    id: 1,
    name: "Laura Martínez",
    role: "Cliente frecuente",
    text: "El pan de masa madre de Aroko es simplemente el mejor que he probado. La corteza crujiente y la miga perfecta me hacen volver cada semana.",
    stars: 5,
    avatar: "LM",
  },
  {
    id: 2,
    name: "Carlos Rodríguez",
    role: "Pedido corporativo",
    text: "Pedimos para el evento de la empresa y todos quedaron encantados. La torta de chocolate fue el centro de atención. ¡Volveremos sin duda!",
    stars: 5,
    avatar: "CR",
  },
  {
    id: 3,
    name: "Sofía Herrera",
    role: "Cliente habitual",
    text: "Los croissants son una obra de arte. Se nota el cuidado artesanal en cada bocado. El servicio también es excelente y muy puntual.",
    stars: 5,
    avatar: "SH",
  },
];

const LIMIT = 4;

export default function Testimonios() {
  const [rating, setRating]     = useState(0);
  const [hovered, setHovered]   = useState(0);
  const [sent, setSent]         = useState(false);
  const [expanded, setExpanded] = useState(false);

  const visible = expanded ? TESTIMONIOS : TESTIMONIOS.slice(0, LIMIT);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 3000);
    e.target.reset();
    setRating(0);
  };

  return (
    <section id="nosotros" className={styles.section}>
      <div className={styles.inner}>

        <div className={styles.header}>
          <span className={styles.eyebrow}>Lo que dicen de nosotros</span>
          <h2 className={styles.title}>Clientes que nos <em>eligen</em></h2>
          <p className={styles.subtitle}>Cada opinión nos inspira a seguir horneando con amor.</p>
        </div>

        <div className={styles.layout}>

          {/* Cards */}
          <div className={styles.cards}>
            {visible.map((t, i) => (
              <div
                key={t.id}
                className={styles.card}
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className={styles.cardTop}>
                  <div className={styles.stars}>
                    {Array.from({ length: t.stars }).map((_, j) => (
                      <span key={j} className={styles.starFilled}>★</span>
                    ))}
                  </div>
                  <span className={styles.verifiedBadge}>✓ Verificado</span>
                </div>
                <p className={styles.text}>{t.text}</p>
                <div className={styles.author}>
                  <div className={styles.avatar}>{t.avatar}</div>
                  <div className={styles.authorInfo}>
                    <strong className={styles.name}>{t.name}</strong>
                    <span className={styles.role}>{t.role}</span>
                  </div>
                </div>
              </div>
            ))}

            {TESTIMONIOS.length > LIMIT && (
              <button
                className={styles.verMasBtn}
                onClick={() => setExpanded((v) => !v)}
              >
                {expanded ? "Ver menos ↑" : `Ver más (${TESTIMONIOS.length - LIMIT} más) ↓`}
              </button>
            )}
          </div>

          {/* Formulario */}
          <div className={styles.formWrap}>
            <div className={styles.formHeader}>
              <span className={styles.formEyebrow}>Tu opinión importa</span>
              <h3 className={styles.formTitle}>Deja tu <em>comentario</em></h3>
              <p className={styles.formDesc}>¿Probaste algo de Aroko? Cuéntanos tu experiencia.</p>
            </div>

            {sent ? (
              <div className={styles.successMsg}>
                <span className={styles.successIcon}>🎉</span>
                <p>¡Gracias por tu comentario!</p>
                <span>Lo revisaremos pronto.</span>
              </div>
            ) : (
              <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Nombre</label>
                    <input className={styles.input} type="text" placeholder="Tu nombre" required />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Correo</label>
                    <input className={styles.input} type="email" placeholder="tu@correo.com" required />
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Calificación</label>
                  <div className={styles.starPicker}>
                    {[1,2,3,4,5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={`${styles.starBtn} ${s <= (hovered || rating) ? styles.starActive : ""}`}
                        onMouseEnter={() => setHovered(s)}
                        onMouseLeave={() => setHovered(0)}
                        onClick={() => setRating(s)}
                        aria-label={`${s} estrellas`}
                      >
                        <FiStar />
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Comentario</label>
                  <textarea
                    className={styles.textarea}
                    placeholder="Cuéntanos tu experiencia con Aroko..."
                    rows={4}
                    required
                  />
                </div>

                <button type="submit" className={styles.submitBtn}>
                  <FiSend /> Enviar comentario
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
