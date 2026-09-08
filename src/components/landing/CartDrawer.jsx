import { motion, AnimatePresence } from "framer-motion";
void motion;
import { useNavigate } from "react-router-dom";
import { FiX, FiTrash2, FiMinus, FiPlus, FiShoppingBag } from "react-icons/fi";
import styles from "./CartDrawer.module.css";
import { resolveImageUrl } from "../../utils/image";
import { useAuthContext } from "../../context/AuthContext";

export default function CartDrawer({ open, onClose, items, onRemove, onUpdateQty, total, onCheckout }) {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const safeTotal = Number(total) || 0;

  const handleCheckout = () => {
    onClose();
    if (!user) { navigate("/login"); return; }
    onCheckout?.();
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.aside
            className={styles.drawer}
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
          >
            {/* Header */}
            <div className={styles.header}>
              <div className={styles.headerLeft}>
                <FiShoppingBag className={styles.headerIcon} />
                <h2 className={styles.title}>Mi carrito</h2>
                {items.length > 0 && (
                  <span className={styles.badge}>{items.reduce((a, i) => a + i.qty, 0)}</span>
                )}
              </div>
              <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar carrito">
                <FiX />
              </button>
            </div>

            {/* Items */}
            <div className={styles.body}>
              {items.length === 0 ? (
                <div className={styles.empty}>
                  <FiShoppingBag className={styles.emptyIcon} />
                  <p>Tu carrito está vacío</p>
                  <span>Agrega productos del catálogo</span>
                  <button className={styles.emptyBtn} onClick={() => { onClose(); navigate("/catalogo"); }}>
                    Ver catálogo
                  </button>
                </div>
              ) : (
                <ul className={styles.list}>
                  <AnimatePresence>
                    {items.map((item) => (
                      <motion.li
                        key={item.id}
                        className={styles.item}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 30, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <img
                          src={resolveImageUrl(item.imagen ?? item.img ?? item.foto ?? item.imagen_url ?? null) || 'https://placehold.co/80x80?text=Sin+imagen'}
                          alt={item.name}
                          className={styles.itemImg}
                          loading="lazy"
                          decoding="async"
                          width="62"
                          height="62"
                        />
                        <div className={styles.itemInfo}>
                          <span className={styles.itemName}>{item.name}</span>
                          <span className={styles.itemPrice}>{item.priceLabel}</span>
                          <div className={styles.qtyRow}>
                            <button
                              className={styles.qtyBtn}
                              onClick={() => onUpdateQty(item.id, item.qty - 1)}
                              aria-label="Reducir cantidad"
                            >
                              <FiMinus />
                            </button>
                            <input
                              className={styles.qty}
                              type="number"
                              min="1"
                              value={item.qty}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                if (!isNaN(val)) onUpdateQty(item.id, val);
                              }}
                              onBlur={(e) => {
                                const val = parseInt(e.target.value, 10);
                                if (isNaN(val) || val < 1) onUpdateQty(item.id, 1);
                              }}
                              aria-label="Cantidad"
                            />
                            <button
                              className={styles.qtyBtn}
                              onClick={() => onUpdateQty(item.id, item.qty + 1)}
                              aria-label="Aumentar cantidad"
                            >
                              <FiPlus />
                            </button>
                          </div>
                        </div>
                        <button
                          className={styles.removeBtn}
                          onClick={() => onRemove(item.id)}
                          aria-label={`Eliminar ${item.name}`}
                        >
                          <FiTrash2 />
                        </button>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className={styles.footer}>
                <div className={styles.totalRow}>
                  <span className={styles.totalLabel}>Total</span>
                  <span className={styles.totalValue}>${safeTotal.toLocaleString("es-CO")}</span>
                </div>

                <button
                  className={styles.checkoutBtn}
                  onClick={handleCheckout}
                  disabled={safeTotal === 0 || items.length === 0}
                >
                  Ir a pagar
                </button>
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
