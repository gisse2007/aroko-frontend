import { useNavigate } from "react-router-dom";
import styles from "./Categories.module.css";

// Unsplash: auto=format (AVIF/WebP), w=600 y q=70 para tarjetas de categoría
const CATS = [
  {
    id: 1,
    name: "Panadería",
    img: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=70",
  },
  {
    id: 2,
    name: "Postres",
    img: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=70",
  },
  {
    id: 3,
    name: "Ediciones Especiales",
    img: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=600&q=70",
  },
];

export default function Categories() {
  const navigate = useNavigate();
  return (
    <section id="categorias" className={styles.section}>
      <div className={styles.inner}>

        <div className={styles.header}>
          <p className={styles.eyebrow}>Lo que ofrecemos</p>
          <h2 className={styles.title}>Nuestras <em>categorías</em></h2>
        </div>

        <div className={styles.grid}>
          {CATS.map((cat, i) => (
            <div
              key={cat.id}
              className={styles.card}
              style={{ animationDelay: `${i * 0.12}s` }}
            >
              <img src={cat.img} alt={cat.name} className={styles.img} loading="lazy" width="600" height="400" />
              <div className={styles.overlay} />
              <div className={styles.content}>
                <h3 className={styles.name}>{cat.name}</h3>
                <button className={styles.btn} onClick={() => navigate("/catalogo")}>Ir</button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
