import { useState, useEffect, memo } from "react";
import { FiEdit2, FiTrash2, FiEye, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { TableLoading } from "../loading/Loading";
import Tooltip from "../Tooltip/Tooltip";
import styles from "./Table.module.css";

const PAGE_SIZE = 6;

const TableRow = memo(function TableRow({ row, columns, hasActions, showView, showEdit, showDelete, extraActions, onView, onEdit, onDelete }) {
  return (
    <tr className={styles.row}>
      {columns.map((col, j) => (
        <td key={col.key ?? j}>
          {col.render ? col.render(row[col.key], row) : row[col.key]}
        </td>
      ))}
      {hasActions && (
        <td className={styles.actions}>
          {extraActions?.(row)}
          {showView && (
            <Tooltip label="Ver detalle">
              <button className={`${styles.btn} ${styles.view}`} onClick={() => onView?.(row)} aria-label="Ver detalle">
                <FiEye />
              </button>
            </Tooltip>
          )}
          {showEdit && (
            <Tooltip label="Editar">
              <button className={`${styles.btn} ${styles.edit}`} onClick={() => onEdit?.(row)} aria-label="Editar">
                <FiEdit2 />
              </button>
            </Tooltip>
          )}
          {showDelete && (
            <Tooltip label="Eliminar">
              <button className={`${styles.btn} ${styles.delete}`} onClick={() => onDelete?.(row)} aria-label="Eliminar">
                <FiTrash2 />
              </button>
            </Tooltip>
          )}
        </td>
      )}
    </tr>
  );
});

/**
 * @param {Object[]}  columns      - [{ key, label, render? }]
 * @param {Object[]}  data         - array COMPLETO (la tabla pagina internamente)
 * @param {string}    emptyMessage - mensaje cuando no hay filas
 * @param {Function}  onView       - (row) => void
 * @param {Function}  onEdit       - (row) => void
 * @param {Function}  onDelete     - (row) => void
 * @param {Function}  extraActions - (row) => ReactNode
 * @param {boolean}   showView | showEdit | showDelete
 * @param {number}    resetKey     - cambia este valor para resetear la página a 1 (ej: al filtrar)
 */
export default function Table({
  columns = [],
  data = [],
  emptyMessage = "Sin datos",
  loading = false,
  onView,
  onEdit,
  onDelete,
  extraActions,
  showView   = true,
  showEdit   = true,
  showDelete = true,
  resetKey,
}) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setPage(1), 0);
    return () => clearTimeout(timer);
  }, [data.length, resetKey]);

  // Mostrar skeleton de carga antes de renderizar la tabla
  if (loading) return <TableLoading />;

  const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
  const rows       = data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasActions = showView || showEdit || showDelete || !!extraActions;
  const showPager  = data.length > PAGE_SIZE;

  return (
    <div className={styles.wrapper}>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th key={col.key ?? i}>{col.label}</th>
              ))}
              {hasActions && <th className={styles.actionsHead}>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (hasActions ? 1 : 0)} className={styles.empty}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <TableRow
                  key={row.id ?? i}
                  row={row}
                  columns={columns}
                  hasActions={hasActions}
                  showView={showView}
                  showEdit={showEdit}
                  showDelete={showDelete}
                  extraActions={extraActions}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Paginación interna — solo si hay más de 6 registros ── */}
      {showPager && (
        <div className={styles.pagination}>
          <span className={styles.pageInfo}>
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, data.length)} de {data.length}
          </span>
          <div className={styles.pageBtns}>
            <Tooltip label="Página anterior">
              <button
                className={styles.pageBtn}
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
                aria-label="Página anterior"
              >
                <FiChevronLeft />
              </button>
            </Tooltip>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                className={`${styles.pageBtn} ${n === page ? styles.pageBtnActive : ""}`}
                onClick={() => setPage(n)}
              >
                {n}
              </button>
            ))}
            <Tooltip label="Página siguiente">
              <button
                className={styles.pageBtn}
                onClick={() => setPage((p) => p + 1)}
                disabled={page === totalPages}
                aria-label="Página siguiente"
              >
                <FiChevronRight />
              </button>
            </Tooltip>
          </div>
        </div>
      )}
    </div>
  );
}
