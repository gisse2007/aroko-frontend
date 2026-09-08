import { useState } from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { FiTarget, FiStar, FiPackage, FiCheckCircle, FiZap, FiHeart } from "react-icons/fi";
import Navbar  from "../../components/landing/Navbar";
import Footer  from "../../components/landing/Footer";
import CartDrawer from "../../components/landing/CartDrawer";
import CheckoutModal from "../../components/landing/CheckoutModal";
import { useCart } from "../../context/CartContext";
import styles from "./NosotrosPage.module.css";
import "../landing/landing.css";

const VALORES = [
  { icon: FiPackage,     title: "Ingredientes premium",  desc: "Seleccionamos cada insumo con criterio artesanal, priorizando calidad y origen." },
  { icon: FiCheckCircle, title: "Compromiso real",        desc: "Cada pedido es una promesa. Puntualidad, frescura y atención en cada entrega." },
  { icon: FiZap,         title: "Creatividad constante",  desc: "Innovamos en sabores y presentaciones sin perder la esencia artesanal." },
  { icon: FiHeart,       title: "Amor por el oficio",     desc: "Horneamos con pasión genuina. Se nota en cada miga, en cada capa, en cada bocado." },
];

const EQUIPO = [
  {
    name: "Valentina Torres",
    role: "Fundadora & Chef Pastelera",
    desc: "10 años perfeccionando el arte de la repostería francesa con alma colombiana.",
    img: "https://images.unsplash.com/photo-1607631568010-a87245c0daf8?w=400&q=80&auto=format&fit=crop&face",
    initials: "VT",
  },
  {
    name: "Andrés Morales",
    role: "Maestro Panadero",
    desc: "Especialista en fermentación lenta y panes de masa madre con más de 8 años de experiencia.",
    img: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&q=80&auto=format&fit=crop",
    initials: "AM",
  },
  {
    name: "Camila Ríos",
    role: "Diseñadora de Tortas",
    desc: "Convierte cada celebración en una obra de arte comestible, personalizada al detalle.",
    img: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80&auto=format&fit=crop",
    initials: "CR",
  },
  {
    name: "Felipe Gómez",
    role: "Jefe de Producción",
    desc: "Garantiza que cada producto salga perfecto del horno, cuidando tiempos y estándares.",
    img: "https://images.unsplash.com/photo-1581299894007-aaa50297cf16?w=400&q=80&auto=format&fit=crop",
    initials: "FG",
  },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 36 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
});

export default function NosotrosPage() {
  const { items, remove, updateQty, total, count, clear } = useCart();
  const [cartOpen,     setCartOpen]     = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  return (
    <div className="landingRoot">
      <Navbar cartCount={count} onCartClick={() => setCartOpen(true)} />

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <motion.span className={styles.eyebrow} {...fadeUp(0.1)}>
            Nuestra historia
          </motion.span>
          <motion.h1 className={styles.heroTitle} {...fadeUp(0.25)}>
            Hechos con <em>amor</em>,<br />entregados con <em>orgullo</em>
          </motion.h1>
          <motion.p className={styles.heroSub} {...fadeUp(0.4)}>
            Somos Aroko, una panadería y repostería artesanal nacida en Bogotá con el sueño de llevar sabores únicos a cada mesa.
          </motion.p>
        </div>
        <div className={styles.heroWave}>
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none">
            <path d="M0,40 C480,80 960,0 1440,40 L1440,80 L0,80 Z" fill="#FDF8F0" />
          </svg>
        </div>
      </section>

      {/* ── Historia ── */}
      <section className={styles.historia}>
        <div className={styles.inner}>
          <motion.div className={styles.historiaGrid} {...fadeUp(0)}>
            <div className={styles.historiaImg}>
              <img
                src="https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=85&auto=format&fit=crop"
                alt="Panadería Aroko"
              />
              <div className={styles.historiaImgBadge}>
                <strong>2015</strong>
                <span>Fundada</span>
              </div>
            </div>
            <div className={styles.historiaText}>
              <span className={styles.eyebrowDark}>¿Quiénes somos?</span>
              <h2 className={styles.sectionTitle}>Una historia que<br /><em>sabe a hogar</em></h2>
              <p>Aroko nació en 2015 en una pequeña cocina del barrio La Candelaria, cuando Valentina Torres decidió convertir su pasión por la repostería en algo más grande.</p>
              <p>Lo que empezó como tortas para amigos y familia, hoy es una panadería reconocida por su calidad artesanal, sus ingredientes premium y el cariño que ponemos en cada pieza.</p>
              <div className={styles.statsRow}>
                {[["9+", "Años de experiencia"], ["8k+", "Clientes felices"], ["500+", "Productos únicos"]].map(([n, l]) => (
                  <div key={l} className={styles.statItem}>
                    <strong>{n}</strong>
                    <span>{l}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Misión & Visión ── */}
      <section className={styles.mvSection}>
        <div className={styles.inner}>
          <div className={styles.mvGrid}>
            <motion.div className={styles.mvCard} {...fadeUp(0)}>
              <div className={`${styles.mvIcon} ${styles.mvIconBlue}`}><FiTarget /></div>
              <h3 className={styles.mvTitle}>Misión</h3>
              <p className={styles.mvText}>
                Elaborar productos de panadería y repostería artesanal con ingredientes de la más alta calidad, ofreciendo una experiencia sensorial única que conecte a las personas con el placer genuino de lo bien hecho.
              </p>
            </motion.div>
            <motion.div className={styles.mvCard} {...fadeUp(0.15)}>
              <div className={`${styles.mvIcon} ${styles.mvIconGold}`}><FiStar /></div>
              <h3 className={styles.mvTitle}>Visión</h3>
              <p className={styles.mvText}>
                Ser la panadería artesanal de referencia en Colombia para 2030, reconocida por la excelencia de sus productos, la innovación constante y el impacto positivo en las comunidades donde operamos.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Valores ── */}
      <section className={styles.valoresSection}>
        <div className={styles.inner}>
          <div className={styles.sectionHeader}>
            <span className={styles.eyebrowCenter}>Lo que nos mueve</span>
            <h2 className={styles.sectionTitleCenter}>Nuestros <em>valores</em></h2>
          </div>
          <div className={styles.valoresGrid}>
            {VALORES.map((v, i) => (
              <motion.div key={v.title} className={styles.valorCard} {...fadeUp(i * 0.1)}>
                <div className={styles.valorIconWrap}><v.icon className={styles.valorIcon} /></div>
                <h4 className={styles.valorTitle}>{v.title}</h4>
                <p className={styles.valorDesc}>{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Equipo ── */}
      <section className={styles.equipoSection}>
        <div className={styles.inner}>
          <div className={styles.sectionHeader}>
            <span className={styles.eyebrowCenter}>Las manos detrás de Aroko</span>
            <h2 className={styles.sectionTitleCenter}>Nuestro <em>equipo</em></h2>
          </div>
          <div className={styles.equipoGrid}>
            {EQUIPO.map((m, i) => (
              <motion.div key={m.name} className={styles.equipoCard} {...fadeUp(i * 0.1)}>
                <div className={styles.equipoImgWrap}>
                  <img src={m.img} alt={m.name} className={styles.equipoImg} />
                  <div className={styles.equipoImgOverlay} />
                </div>
                <div className={styles.equipoBody}>
                  <strong className={styles.equipoName}>{m.name}</strong>
                  <span className={styles.equipoRole}>{m.role}</span>
                  <p className={styles.equipoDesc}>{m.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaInner}>
          <motion.h2 className={styles.ctaTitle} {...fadeUp(0)}>
            ¿Listo para probar<br />algo <em>extraordinario</em>?
          </motion.h2>
          <motion.p className={styles.ctaDesc} {...fadeUp(0.15)}>
            Explora nuestro catálogo y encuentra el producto perfecto para tu momento especial.
          </motion.p>
          <motion.a href="/catalogo" className={styles.ctaBtn} {...fadeUp(0.25)}>
            Ver catálogo →
          </motion.a>
        </div>
      </section>

      <Footer />
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={items}
        onRemove={remove}
        onUpdateQty={updateQty}
        total={total}
        onCheckout={() => { setCartOpen(false); setCheckoutOpen(true); }}
      />
      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        items={items}
        total={total}
        onSuccess={clear}
      />
    </div>
  );
}
