import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FiShoppingCart, FiCheck, FiPackage, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import styles from "./Novedades.module.css";
import { resolveImageUrl } from "../../utils/image";
import { whenIdle, cancelIdle } from "../../utils/idle";
import { fetchNuevos } from "../../services/catalogoService";

const PLACEHOLDER = "https://placehold.co/400x300?text=Sin+imagen";
const LIMIT = 6;

function SkeletonCard() {
  return (
    <div className={`${styles.card} ${styles.skeletonCard}`}>
      <div className={`${styles.imgWrap} ${styles.skeletonImg}`} />
      <div className={styles.body}>
        <div className={styles.skeletonLine} style={{ width: "40%", height: 11, borderRadius: 6 }} />
        <div className={styles.skeletonLine} style={{ width: "75%", height: 16, marginTop: 8, borderRadius: 6 }} />
        <div className={styles.skeletonLine} style={{ width: "88%", height: 13, marginTop: 6, borderRadius: 6 }} />
        <div className={styles.footer}>
          <div className={styles.skeletonLine} style={{ width: "32%", height: 22, borderRadius: 6 }} />
          <div className={styles.skeletonLine} style={{ width: "36%", height: 38, borderRadius: 999 }} />
        </div>
      </div>
    </div>
  );
}

export default function Novedades({ onAddToCart }) {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(4);
  const containerRef = useRef(null);

  useEffect(() => {
    const updateVisible = () => {
      const width = window.innerWidth;
      setVisibleCount(width <= 640 ? 1 : width <= 1024 ? 2 : 4);
    };
    updateVisible();
    window.addEventListener("resize", updateVisible);
    return () => window.removeEventListener("resize", updateVisible);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetchNuevos({ limit: LIMIT })
        .then((res) => {
          if (!cancelled && res) setProducts(res.products ?? []);
        })
        .catch(() => {
          if (!cancelled) setProducts([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };
    const handle = whenIdle(load, 1500);
    return () => {
      cancelled = true;
      cancelIdle(handle);
    };
  }, []);

  const handleAdd = useCallback((product) => {
    if (typeof onAddToCart !== "function") return;
    const price = Number(product.precio ?? 0);
    onAddToCart({
      id: product.id_producto,
      name: product.nombre,
      price,
      priceLabel: `$${price.toLocaleString("es-CO")}`,
      img: resolveImageUrl(product.imagen) || PLACEHOLDER,
    });
    setAdded((previous) => ({ ...previous, [product.id_producto]: true }));
    setTimeout(() => setAdded((previous) => ({ ...previous, [product.id_producto]: false })), 1400);
  }, [onAddToCart]);

  const maxIndex = Math.max(0, products.length - visibleCount);

  return (
    <section id="novedades" className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <span className={styles.eyebrow}>Lo mas reciente</span>
          <h2 className={styles.title}>LO <em>NUEVO</em></h2>
          <p className={styles.subtitle}>Productos frescos y nuestras mas recientes creaciones directo del horno.</p>
        </div>

        {loading && <div className={styles.grid}>{Array.from({ length: LIMIT }, (_, index) => <SkeletonCard key={index} />)}</div>}

        {!loading && products.length === 0 && (
          <div className={styles.emptyState}>
            <FiPackage className={styles.emptyIcon} aria-hidden="true" />
            <p className={styles.emptyTitle}>Proximamente</p>
            <p className={styles.emptyDesc}>Estamos preparando nuestras novedades. Vuelve pronto.</p>
          </div>
        )}

        {!loading && products.length > 0 && (
          <div className={styles.carouselContainer} ref={containerRef}>
            <button type="button" className={`${styles.carouselNavBtn} ${styles.navPrev}`} onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))} disabled={currentIndex === 0} aria-label="Anterior">
              <FiChevronLeft />
            </button>
            <div className={styles.carouselViewport}>
              <div className={styles.carouselTrack} style={{ transform: `translateX(calc(-${currentIndex} * (${100 / visibleCount}% + ${24 / visibleCount}px)))` }}>
                {products.map((product, index) => {
                  const price = Number(product.precio ?? 0);
                  const isAdded = !!added[product.id_producto];
                  return (
                    <div key={product.id_producto} className={styles.carouselSlide}>
                      <div className={styles.card} style={{ animationDelay: `${index * 0.06}s` }}>
                        <div className={styles.imgWrap}>
                          <img src={resolveImageUrl(product.imagen) || PLACEHOLDER} alt={product.nombre} className={styles.img} loading="lazy" width="400" height="300" onError={(event) => { event.currentTarget.src = PLACEHOLDER; }} />
                          {product.categoria_nombre && <span className={styles.tag}>{product.categoria_nombre}</span>}
                          {(product.es_nuevo || product.es_temporada) && <div className={styles.badgeGroup}>
                            {product.es_temporada && <span className={styles.badgeTemporada}>Temporada</span>}
                            {!product.es_temporada && product.es_nuevo && <span className={styles.badgeNuevo}>Nuevo</span>}
                          </div>}
                        </div>
                        <div className={styles.body}>
                          <h3 className={styles.name}>{product.nombre}</h3>
                          {product.descripcion && <p className={styles.desc}>{product.descripcion}</p>}
                          <div className={styles.footer}>
                            <span className={styles.price}>${price.toLocaleString("es-CO")}</span>
                            <button className={`${styles.btn} ${isAdded ? styles.btnAdded : ""}`} onClick={() => handleAdd(product)} aria-label={`Agregar ${product.nombre} al carrito`}>
                              {isAdded ? <><FiCheck aria-hidden="true" /> Agregado</> : <><FiShoppingCart aria-hidden="true" /> Agregar</>}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <button type="button" className={`${styles.carouselNavBtn} ${styles.navNext}`} onClick={() => setCurrentIndex((index) => Math.min(maxIndex, index + 1))} disabled={currentIndex >= maxIndex} aria-label="Siguiente">
              <FiChevronRight />
            </button>
            {maxIndex > 0 && <div className={styles.dotsWrap}>{Array.from({ length: maxIndex + 1 }, (_, index) => <button key={index} type="button" className={`${styles.dot} ${currentIndex === index ? styles.dotActive : ""}`} onClick={() => setCurrentIndex(index)} aria-label={`Ir al slide ${index + 1}`} />)}</div>}
          </div>
        )}

        <div className={styles.verMasWrap}>
          <button className={styles.verMasBtn} onClick={() => navigate("/catalogo")}>Ver mas productos</button>
        </div>
      </div>
    </section>
  );
}
