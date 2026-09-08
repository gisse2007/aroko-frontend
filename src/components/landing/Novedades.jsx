import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
// Tree-shaking: iconos importados individualmente desde react-icons/fi
import { FiShoppingCart, FiCheck, FiPackage } from "react-icons/fi";
import styles from "./Novedades.module.css";
import { resolveImageUrl } from "../../utils/image";
import { whenIdle, cancelIdle } from "../../utils/idle";
import { fetchCatalogo } from "../../services/catalogoService";
import { fetchCategoriasProductos } from "../../services/categoriasCache";

const PLACEHOLDER = "https://placehold.co/400x300?text=Sin+imagen";
const LIMIT = 4;

// Nombres posibles de la categoría novedades (case-insensitive)
const NOVEDAD_NAMES = ["novedades", "novedad", "nuevo", "nuevos", "new"];

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

  useEffect(() => {
    let cancelled = false;

    const normalizeCatName = (value) =>
      String(value ?? "").toLowerCase().replace(/\s+/g, " ").trim();

    const load = () => {
      // 1. Buscar la categoría "Novedades" en la BD (cache compartido)
      fetchCategoriasProductos()
        .then((todas) => {
          if (cancelled) return;
          const activas = todas.filter((c) => c.estado === "ACTIVO" || c.estado === undefined);
          const catNovedad = activas.find((c) => {
            const nombre = normalizeCatName(c.nombre ?? c.nombre_categoria ?? "");
            return NOVEDAD_NAMES.some((key) => nombre === key || nombre.includes(key));
          });

          if (!catNovedad) {
            setProducts([]);
            setLoading(false);
            return;
          }

          return fetchCatalogo({
            categoria_id: catNovedad.id_categoria,
            page: 1,
            limit: LIMIT,
          });
        })
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

  return (
    <section id="novedades" className={styles.section}>
      <div className={styles.inner}>

        <div className={styles.header}>
          <span className={styles.eyebrow}>Lo más reciente</span>
          <h2 className={styles.title}>Nuestras <em>novedades</em></h2>
          <p className={styles.subtitle}>
            Creaciones frescas que salen directo del horno a tu mesa.
          </p>
        </div>

        {/* Estado de carga */}
        {loading && (
          <div className={styles.grid}>
            {Array.from({ length: LIMIT }, (_, i) => <SkeletonCard key={i} />)}
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
        {!loading && products.length > 0 && (
          <>
            <div className={styles.grid}>
              {products.map((p, i) => {
                const imagen  = resolveImageUrl(p.imagen) || PLACEHOLDER;
                const precio  = Number(p.precio ?? 0);
                const isAdded = !!added[p.id_producto];

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
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={styles.verMasWrap}>
              <button className={styles.verMasBtn} onClick={() => navigate("/catalogo")}>
                Ver más productos →
              </button>
            </div>
          </>
        )}

      </div>
    </section>
  );
}
