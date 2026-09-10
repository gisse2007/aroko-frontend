import { useState, useEffect, useCallback } from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
// Tree-shaking: iconos importados individualmente desde react-icons/fi
import { FiShoppingCart, FiCheck, FiPackage } from "react-icons/fi";
import { FiShoppingCart, FiCheck, FiPackage, FiChevronLeft, FiChevronRight, FiSparkles, FiCalendar } from "react-icons/fi";
import styles from "./Novedades.module.css";
import { resolveImageUrl } from "../../utils/image";
import { whenIdle, cancelIdle } from "../../utils/idle";
import { fetchNuevos } from "../../services/catalogoService";

const PLACEHOLDER = "https://placehold.co/400x300?text=Sin+imagen";
const LIMIT = 4;
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
  const [loading,  setLoading]  = useState(true);
  const [added,    setAdded]    = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(4);
  const containerRef = useRef(null);

  // Calcular tarjetas visibles según el ancho de la ventana
  useEffect(() => {
    const updateVisible = () => {
      const w = window.innerWidth;
      if (w <= 640) {
        setVisibleCount(1);
      } else if (w <= 1024) {
        setVisibleCount(2);
      } else {
        setVisibleCount(4);
      }
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
          if (cancelled || !res) return;
          setProducts(res.products ?? []);
        })
        .catch(() => {
          if (!cancelled) setProducts([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };

    // Carga diferida: no compite con el render/LCP del Hero
    const handle = whenIdle(load, 1500);

    return () => { cancelled = true; cancelIdle(handle); };
  }, []);

  const handleAdd = useCallback((p) => {
    if (typeof onAddToCart !== "function") return;
    const precio = Number(p.precio ?? 0);
    onAddToCart({
      id:         p.id_producto,
      name:       p.nombre,
      price:      precio,
      priceLabel: `$${precio.toLocaleString("es-CO")}`,
      img:        resolveImageUrl(p.imagen) || PLACEHOLDER,
    });
    setAdded((prev) => ({ ...prev, [p.id_producto]: true }));
    setTimeout(() => setAdded((prev) => ({ ...prev, [p.id_producto]: false })), 1400);
  }, [onAddToCart]);

  const maxIndex = Math.max(0, products.length - visibleCount);

  const prevSlide = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  return (
    <section id="novedades" className={styles.section}>
      <div className={styles.inner}>

        <div className={styles.header}>
          <span className={styles.eyebrow}>Lo más reciente</span>
          <h2 className={styles.title}>LO <em>NUEVO</em></h2>
          <p className={styles.subtitle}>
            Productos frescos de temporada y nuestras más recientes creaciones directo del horno.
            Descubre nuestras más frescas recetas y productos de temporada saliendo calientitos del horno.
          </p>
        </div>

        {/* Estado de carga */}
        {loading && (
          <div className={styles.grid}>
            {Array.from({ length: LIMIT }, (_, i) => <SkeletonCard key={i} />)}
            {Array.from({ length: Math.min(4, LIMIT) }, (_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Sin productos */}
        {!loading && products.length === 0 && (
          <div className={styles.emptyState}>
            <FiPackage className={styles.emptyIcon} aria-hidden="true" />
            <p className={styles.emptyTitle}>Próximamente</p>
            <p className={styles.emptyDesc}>
              Estamos preparando nuestras novedades. ¡Vuelve pronto!
            </p>
          </div>
        )}

        {/* Grid de productos */}
        {/* Carrusel de productos */}
        {!loading && products.length > 0 && (
          <>
            <div className={styles.grid}>
              {products.map((p, i) => {
                const imagen  = resolveImageUrl(p.imagen) || PLACEHOLDER;
                const precio  = Number(p.precio ?? 0);
                const isAdded = !!added[p.id_producto];
          <div className={styles.carouselContainer} ref={containerRef}>
            {/* Flecha anterior */}
            <button
              type="button"
              className={`${styles.carouselNavBtn} ${styles.navPrev}`}
              onClick={prevSlide}
              disabled={currentIndex === 0}
              aria-label="Anterior"
            >
              <FiChevronLeft />
            </button>

                return (
                  <div
                    key={p.id_producto}
                    className={styles.card}
                    style={{ animationDelay: `${i * 0.08}s` }}
                  >
                    <div className={styles.imgWrap}>
                      <img
                        src={imagen}
                        alt={p.nombre}
                        className={styles.img}
                        loading="lazy"
                        decoding="async"
                        width="400"
                        height="300"
                        onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
                      />
                      {p.categoria_nombre && (
                        <span className={styles.tag}>{p.categoria_nombre}</span>
                      )}
                      {(p.es_nuevo || p.es_temporada) && (
                        <div className={styles.badgeGroup}>
                          {p.es_nuevo && <span className={styles.badgeNuevo}>Nuevo</span>}
                          {p.es_temporada && <span className={styles.badgeTemporada}>Temporada</span>}
            {/* Viewport & Track */}
            <div className={styles.carouselViewport}>
              <div
                className={styles.carouselTrack}
                style={{
                  transform: `translateX(calc(-${currentIndex} * (${100 / visibleCount}% + ${24 / visibleCount}px)))`,
                }}
              >
                {products.map((p, i) => {
                  const imagen  = resolveImageUrl(p.imagen) || PLACEHOLDER;
                  const precio  = Number(p.precio ?? 0);
                  const isAdded = !!added[p.id_producto];

                  return (
                    <div key={p.id_producto} className={styles.carouselSlide}>
                      <div
                        className={styles.card}
                        style={{ animationDelay: `${i * 0.06}s` }}
                      >
                        <div className={styles.imgWrap}>
                          <img
                            src={imagen}
                            alt={p.nombre}
                            className={styles.img}
                            loading="lazy"
                            decoding="async"
                            width="400"
                            height="300"
                            onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
                          />
                          {p.categoria_nombre && (
                            <span className={styles.tag}>{p.categoria_nombre}</span>
                          )}
                          {(p.es_nuevo || p.es_temporada) && (
                            <div className={styles.badgeGroup}>
                              {p.es_temporada && <span className={styles.badgeTemporada}>Temporada</span>}
                              {!p.es_temporada && p.es_nuevo && <span className={styles.badgeNuevo}>Nuevo</span>}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className={styles.body}>
                      <h3 className={styles.name}>{p.nombre}</h3>
                      {p.descripcion && (
                        <p className={styles.desc}>{p.descripcion}</p>
                      )}
                      <div className={styles.footer}>
                        <span className={styles.price}>
                          ${precio.toLocaleString("es-CO")}
                        </span>
                        <button
                          className={`${styles.btn} ${isAdded ? styles.btnAdded : ""}`}
                          onClick={() => handleAdd(p)}
                          aria-label={`Agregar ${p.nombre} al carrito`}
                        >
                          {isAdded
                            ? <><FiCheck aria-hidden="true" /> Agregado</>
                            : <><FiShoppingCart aria-hidden="true" /> Agregar</>}
                        </button>
                        <div className={styles.body}>
                          <h3 className={styles.name}>{p.nombre}</h3>
                          {p.descripcion && (
                            <p className={styles.desc}>{p.descripcion}</p>
                          )}
                          <div className={styles.footer}>
                            <span className={styles.price}>
                              ${precio.toLocaleString("es-CO")}
                            </span>
                            <button
                              className={`${styles.btn} ${isAdded ? styles.btnAdded : ""}`}
                              onClick={() => handleAdd(p)}
                              aria-label={`Agregar ${p.nombre} al carrito`}
                            >
                              {isAdded
                                ? <><FiCheck aria-hidden="true" /> Agregado</>
                                : <><FiShoppingCart aria-hidden="true" /> Agregar</>}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
                  );
                })}
              </div>
            </div>

            <div className={styles.verMasWrap}>
              <button className={styles.verMasBtn} onClick={() => navigate("/catalogo")}>
                Ver más productos →
              </button>
            </div>
          </>
            {/* Flecha siguiente */}
            <button
              type="button"
              className={`${styles.carouselNavBtn} ${styles.navNext}`}
              onClick={nextSlide}
              disabled={currentIndex >= maxIndex}
              aria-label="Siguiente"
            >
              <FiChevronRight />
            </button>

            {/* Dots */}
            {maxIndex > 0 && (
              <div className={styles.dotsWrap}>
                {Array.from({ length: maxIndex + 1 }, (_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`${styles.dot} ${currentIndex === idx ? styles.dotActive : ""}`}
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={`Ir al slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2 Botones de acción debajo del carrusel */}
        <div className={styles.accionesDobles}>
          <button
            type="button"
            className={styles.btnTemporadaCta}
            onClick={() => navigate("/temporada")}
          >
            <FiCalendar />
            Ver productos en temporada
          </button>

          <button
            type="button"
            className={styles.btnNuevosCta}
            onClick={() => navigate("/catalogo?order_by=recientes")}
          >
            <FiSparkles />
            Ver lo nuevo
          </button>
        </div>

      </div>
    </section>
  );
}


