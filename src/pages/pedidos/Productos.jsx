import Table from "../../components/tables/Table";
import styles from "../PageLayout.module.css";

const COLUMNS = [
  { key: "nombre",    label: "Producto" },
  { key: "categoria", label: "Categoría" },
  { key: "precio",    label: "Precio" },
  {
    key: "stock",
    label: "Stock",
    render: (val) => (
      <span style={{ fontWeight: 600, color: val < 10 ? "#d93025" : "#1a9e5c" }}>
        {val} uds.
      </span>
    ),
  },
  {
    key: "disponible",
    label: "Disponible",
    render: (val) => (
      <span style={{
        padding: "2px 10px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 600,
        background: val ? "#e6f9f0" : "#fdecea",
        color: val ? "#1a9e5c" : "#d93025",
      }}>
        {val ? "Sí" : "No"}
      </span>
    ),
  },
];

const DATA = [
  { id: 1, nombre: "Producto A", categoria: "Bebidas",   precio: "$8,500",  stock: 45,  disponible: true },
  { id: 2, nombre: "Producto B", categoria: "Snacks",    precio: "$3,200",  stock: 12,  disponible: true },
  { id: 3, nombre: "Producto C", categoria: "Lácteos",   precio: "$5,000",  stock: 8,   disponible: true },
  { id: 4, nombre: "Producto D", categoria: "Panadería", precio: "$1,500",  stock: 60,  disponible: true },
  { id: 5, nombre: "Producto E", categoria: "Snacks",    precio: "$2,800",  stock: 3,   disponible: false },
  { id: 6, nombre: "Producto F", categoria: "Bebidas",   precio: "$12,000", stock: 25,  disponible: true },
];

export default function Productos() {
  const handle = (action, row) => console.log(action, row);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>Productos</h2>
        <button className={styles.addBtn}>+ Nuevo producto</button>
      </div>
      <Table
        columns={COLUMNS}
        data={DATA}
        onView={(r)   => handle("ver", r)}
        onEdit={(r)   => handle("editar", r)}
        onDelete={(r) => handle("eliminar", r)}
      />
    </div>
  );
}
