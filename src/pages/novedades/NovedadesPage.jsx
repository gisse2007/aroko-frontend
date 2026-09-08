import { useState } from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { FiShoppingCart, FiCheck } from "react-icons/fi";
import Navbar     from "../../components/landing/Navbar";
import Footer     from "../../components/landing/Footer";
import CartDrawer from "../../components/landing/CartDrawer";
import CheckoutModal from "../../components/landing/CheckoutModal";
import { useCart } from "../../context/CartContext";
import "../landing/landing.css";
import styles from "./NovedadesPage.module.css";

const NOVEDADES = [];
export default function NovedadesPage() {
  const { items, add, remove, updateQty, total, count, clear } = useCart();
  const [cartOpen,     setCartOpen]     = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [added,    setAdded]    = useState({});

  const handleAdd = (p) => {
    add(p);
    setAdded((prev) => ({ ...prev, [p.id]: true }));
    setTimeout(() => setAdded((prev) => ({ ...prev, [p.id]: false })), 1400);
  };

  return (
    <div className="landingRoot">
      <Navbar cartCount={count} onCartClick={() => setCartOpen(true)} />

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <motion.span
            className={styles.eyebrow}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Lo más reciente
          </motion.span>
          <motion.h1
            className={styles.heroTitle}
            initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6 }}
          >
            Nuestras <em>novedades</em>
          </motion.h1>
          <motion.p
            className={styles.heroSub}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            Creaciones frescas que salen directo del horno a tu mesa, cada semana algo nuevo.
          </motion.p>
        </div>
        <div className={styles.heroWave}>
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none">
            <path d="M0,40 C480,80 960,0 1440,40 L1440,80 L0,80 Z" fill="#F5ECD7" />
          </svg>
        </div>
      </section>

      {/* Grid */}
      <section className={styles.section}>
        <div className={styles.inner}>
          <div className={styles.grid}>
            {NOVEDADES.map((p, i) => (
              <motion.div
                key={p.id}
                className={styles.card}
                initial={{ opacity: 0, y: 36 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ delay: i * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className={styles.imgWrap}>
                  <img src={p.img} alt={p.name} className={styles.img} loading="lazy" />
                  <span className={styles.tag}>{p.tag}</span>
                </div>
                <div className={styles.body}>
                  <h3 className={styles.name}>{p.name}</h3>
                  <p className={styles.desc}>{p.desc}</p>
                  <div className={styles.cardFooter}>
                    <span className={styles.price}>{p.priceLabel}</span>
                    <motion.button
                      className={`${styles.addBtn} ${added[p.id] ? styles.addedBtn : ""}`}
                      onClick={() => handleAdd(p)}
                      whileTap={{ scale: 0.92 }}
                    >
                      {added[p.id] ? <><FiCheck /> Agregado</> : <><FiShoppingCart /> Agregar</>}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
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
