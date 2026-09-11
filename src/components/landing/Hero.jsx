import styles from "./Hero.module.css";

// Unsplash: auto=format sirve AVIF/WebP según soporte del navegador;
// w=1400 + q=70 equilibra nitidez y peso para el LCP.
const HERO_IMG = "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=1400&q=70";

const STATS = [
  ["30+",  "Productos"],
  ["4.9★",  "Valoración"],
];

export default function Hero() {
  const scrollTo = (id) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <section id="inicio" className={styles.hero}>
      {/* fetchPriority (camelCase) evita la advertencia del DOM en React 19 */}
      <img src={HERO_IMG} alt="Panadería Aroko" className={styles.bgImg} fetchPriority="high" width="1400" height="933" />
      <div className={styles.overlay} />

      <div className={styles.content}>
        <span className={`${styles.eyebrow} ${styles.animFadeUp1}`}>
          Artesanal · Premium · Único
        </span>

        <h1 className={`${styles.title} ${styles.animFadeUp2}`}>
          Endulza tus<br />
          <em>momentos</em> con Aroko
        </h1>

        <p className={`${styles.subtitle} ${styles.animFadeUp3}`}>
          Panadería y repostería artesanal hecha con ingredientes premium,<br className={styles.br} />
          amor genuino y un toque de magia en cada pieza.
        </p>

        <div className={`${styles.actions} ${styles.animFadeUp4}`}>
          <button className={styles.ctaPrimary} onClick={() => scrollTo("novedades")}>
            Ver temporadas
            Ver lo nuevo
          </button>
          <button className={styles.ctaSecondary} onClick={() => scrollTo("categorias")}>
            Explorar categorías
          </button>
        </div>

        <div className={`${styles.stats} ${styles.animFadeIn5}`}>
          {STATS.map(([n, l]) => (
            <div key={l} className={styles.stat}>
              <strong>{n}</strong>
              <span>{l}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.wave}>
        <svg viewBox="0 0 1440 90" preserveAspectRatio="none">
          <path d="M0,45 C480,90 960,0 1440,45 L1440,90 L0,90 Z" fill="#FDF8F0" />
        </svg>
      </div>
    </section>
  );
}
