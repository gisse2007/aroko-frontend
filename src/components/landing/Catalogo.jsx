import { memo, useCallback, useState, useEffect } from "react";
// Tree-shaking: iconos importados individualmente desde react-icons/fi
import { FiSearch, FiShoppingCart, FiCheck, FiAlertCircle } from "react-icons/fi";
import styles from "./Catalogo.module.css";
import CatalogoSkeleton from "./CatalogoSkeleton";
import { useCatalogo } from "../../hooks/useCatalogo";
import { useCatalogoBusqueda } from "../../hooks/useCatalogoBusqueda";
import { resolveImageUrl } from "../../utils/image";
import { fetchCategoriasProductos } from "../../services/categoriasCache";

// Valores alineados con el backend (order_by param)
const SORT_OPTS = [
  { value: "",             label: "Relevancia"           },
  { value: "precio_asc",   label: "Precio: menor a mayor" },
  { value: "precio_desc",  label: "Precio: mayor a menor" },
  { value: "recientes",    label: "Más recientes"         },
  { value: "mas_vendidos", label: "Más vendidos"          },
];

// ─── Card memoizada ───────────────────────────────────────────────────────────
const ProductCard = memo(function ProductCard({ p, added, onAdd }) {
  const nombre    = p.nombre;
  const categoria = p.categoria_nombre;
  const precio    = Number(p.precio ?? 0);

  const imagen = resolveImageUrl(p.imagen) || 'https://placehold.co/400x300?text=Sin+imagen';

  const handleAdd = () => {
    onAdd(p);
  };

  return (
    // Animación de entrada vía CSS (cardFadeUp); feedback de tap vía :active
    <div className={styles.card}>
      <div className={styles.imgWrap}>
        <img
          src={imagen}
          alt={nombre}
          className={styles.img}
          loading="lazy"
          decoding="async"
          width="400"
          height="300"
        />
        <div className={styles.imgOverlay} />
      </div>

      <div className={styles.body}>
        <span className={styles.cardCat}>{categoria}</span>
        <h3 className={styles.name}>{nombre}</h3>
        <div className={styles.cardFooter}>
          <span className={styles.price}>
            ${precio.toLocaleString("es-CO")}
          </span>
          <button
            className={`${styles.addBtn} ${added ? styles.addedBtn : ""}`}
            onClick={handleAdd}
            aria-label={`Agregar ${nombre} al carrito`}
          >
            {added
              ? <><FiCheck aria-hidden="true" /> Agregado</>
              : <><FiShoppingCart aria-hidden="true" /> Agregar</>}
          </button>
        </div>
      </div>
    </div>
  );
});

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Catalogo({ onAddToCart }) {
  const [categorias,  setCategorias]  = useState([{ id_categoria: 0, nombre: "Todos" }]);
  const [catActiva,   setCatActiva]   = useState(0); // id_categoria activo
  const [added,       setAdded]       = useState({});

  // Cargar categorías reales desde el backend (con cache compartido)
  useEffect(() => {
    fetchCategoriasProductos()
      .then((todas) => {
        const activas = todas.filter((c) => c.estado === "ACTIVO");
        setCategorias([{ id_categoria: 0, nombre: "Todos" }, ...activas]);
      })
      .catch(() => {});
  }, []);

  const {
    query,       setQuery,
    /* categoriaId intentionally unused */ setCategoriaId,
    orderBy,     setOrderBy,
    resultados,  total,
    hasMore:     hasMoreSearch,
    loading:     loadingSearch,
    loadingMore: loadingMoreSearch,
    error:       errorSearch,
    verMas:      verMasSearch,
    isSearching,
  } = useCatalogoBusqueda();

  const {
    productos, loading, loadingMore, hasMore, error: errorCatalogo, verMas,
  } = useCatalogo(isSearching ? null : (catActiva !== 0 ? catActiva : null));

  const handleAdd = useCallback((product) => {
    onAddToCart(product);
    const key = product.id_producto;
    setAdded((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => setAdded((prev) => ({ ...prev, [key]: false })), 1400);
  }, [onAddToCart]);

  const handleCatClick = (cat) => {
    setCatActiva(cat.id_categoria);
    setCategoriaId(cat.id_categoria !== 0 ? cat.id_categoria : "");
  };

  const displayList    = isSearching ? resultados : productos;
  const isLoading      = isSearching ? loadingSearch  : loading;
  const isLoadingMore  = isSearching ? loadingMoreSearch : loadingMore;
  const showHasMore    = isSearching ? hasMoreSearch   : hasMore;
  const handleVerMas   = isSearching ? verMasSearch    : verMas;
  const errorMsg       = isSearching ? errorSearch     : errorCatalogo;

  return (
    <section id="catalogo" className={styles.section} aria-label="Catálogo de productos">
      <div className={styles.inner}>

        {/* Header */}
        <div className={styles.header}>
          <span className={styles.eyebrow}>Lo que tenemos para ti</span>
          <h2 className={styles.title}>Nuestro <em>catálogo</em></h2>
          <p className={styles.subtitle}>Productos frescos, hechos a diario con ingredientes de primera.</p>
        </div>

        {/* Filtros */}
        <div className={styles.filters}>
          <div className={styles.searchWrap}>
            <FiSearch className={styles.searchIcon} aria-hidden="true" />
            <input
              className={styles.searchInput}
              type="search"
              placeholder="Buscar producto..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Buscar productos"
            />
          </div>

          <select
            className={styles.sortSelect}
            value={orderBy}
            onChange={(e) => setOrderBy(e.target.value)}
            aria-label="Ordenar productos"
          >
            {SORT_OPTS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <div className={styles.cats} role="group" aria-label="Filtrar por categoría">
            {categorias.map((cat) => (
              <button
                key={cat.id_categoria}
                className={`${styles.catBtn} ${catActiva === cat.id_categoria ? styles.catActive : ""}`}
                onClick={() => handleCatClick(cat)}
                aria-pressed={catActiva === cat.id_categoria}
              >
                {cat.nombre}
              </button>
            ))}
          </div>
        </div>

        {/* Contador búsqueda */}
        {isSearching && !isLoading && (
          <p className={styles.resultCount} aria-live="polite">
            {total} resultado{total !== 1 ? "s" : ""} encontrado{total !== 1 ? "s" : ""}
          </p>
        )}

        {/* Error */}
        {errorMsg && (
          <div className={styles.errorState} role="alert">
            <FiAlertCircle size={28} aria-hidden="true" />
            <span>{errorMsg}</span>
            <button className={styles.retryBtn} onClick={() => window.location.reload()}>
              Reintentar
            </button>
          </div>
        )}

        {/* Grid */}
        {!errorMsg && (
          <div className={styles.grid}>
            {isLoading ? (
              <CatalogoSkeleton count={8} />
            ) : displayList.length === 0 ? (
              <div className={`${styles.emptyState} ${styles.emptyStateAnim}`} role="status">
                <span className={styles.emptyIcon} aria-hidden="true">🍞</span>
                <p>No encontramos productos{isSearching ? " para tu búsqueda" : " en esta categoría"}.</p>
                {isSearching && (
                  <button className={styles.retryBtn} onClick={() => { setQuery(""); setOrderBy(""); setCategoriaId(""); }}>
                    Limpiar filtros
                  </button>
                )}
              </div>
            ) : (
              displayList.map((p) => (
                <ProductCard
                  key={p.id_producto}
                  p={p}
                  added={!!added[p.id_producto]}
                  onAdd={handleAdd}
                />
              ))
            )}
          </div>
        )}

        {/* Ver más */}
        {showHasMore && !isLoading && !errorMsg && (
          <div className={styles.verMasWrap}>
            <button
              className={styles.verMasBtn}
              onClick={handleVerMas}
              disabled={isLoadingMore}
              aria-busy={isLoadingMore}
            >
              {isLoadingMore
                ? <><span className={styles.btnSpinner} aria-hidden="true" /> Cargando...</>
                : "Ver más productos"}
            </button>
          </div>
        )}

      </div>
    </section>
  );
}
