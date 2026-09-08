import {
  FiUsers, FiSettings, FiShoppingCart, FiPackage, FiTag,
  FiTruck, FiBarChart2, FiShoppingBag, FiUserCheck,
  FiHome, FiDollarSign, FiMapPin, FiArrowDownCircle, FiGrid,
} from "react-icons/fi";

const MENU = [
  {
    label: "Usuarios",
    icon: <FiUsers />,
    access: ["ADMIN", "ADMINISTRADOR", "USUARIOS", "ROLES", "EMPLEADOS"],
    children: [
      { label: "Roles",     icon: <FiSettings />,  path: "/roles", access: ["ADMIN", "ADMINISTRADOR", "ROLES", "USUARIOS"] },
      { label: "Empleados", icon: <FiUserCheck />, path: "/empleados", access: ["ADMIN", "ADMINISTRADOR", "EMPLEADOS", "USUARIOS"] },
    ],
  },
  {
    label: "Compras",
    icon: <FiShoppingCart />,
    access: ["ADMIN", "ADMINISTRADOR", "COMPRAS", "INSUMOS"],
    children: [
      { label: "Categorías de insumos", icon: <FiTag />,            path: "/categorias-insumos", access: ["ADMIN", "ADMINISTRADOR", "COMPRAS", "INSUMOS"] },
      { label: "Insumos",               icon: <FiPackage />,         path: "/insumos", access: ["ADMIN", "ADMINISTRADOR", "COMPRAS", "INSUMOS"] },
      { label: "Proveedores",           icon: <FiTruck />,           path: "/proveedores", access: ["ADMIN", "ADMINISTRADOR", "COMPRAS", "PROVEEDORES"] },
      { label: "Compras",               icon: <FiShoppingCart />,    path: "/compras", access: ["ADMIN", "ADMINISTRADOR", "COMPRAS"] },
      { label: "Salidas de insumos",    icon: <FiArrowDownCircle />, path: "/salidas-insumos", access: ["ADMIN", "ADMINISTRADOR", "COMPRAS", "SALIDAS", "INSUMOS"] },
    ],
  },
  {
    label: "Producción",
    icon: <FiBarChart2 />,
    access: ["ADMIN", "ADMINISTRADOR", "PRODUCCION", "PANADERO"],
    children: [
      { label: "Producción", icon: <FiBarChart2 />, path: "/produccion", access: ["ADMIN", "ADMINISTRADOR", "PRODUCCION", "PANADERO"] },
    ],
  },
  {
    label: "Ventas",
    icon: <FiShoppingBag />,
    access: ["ADMIN", "ADMINISTRADOR", "VENTAS", "VENDEDOR", "PEDIDOS", "CLIENTES", "DOMICILIOS"],
    children: [
      { label: "Categoría de productos", icon: <FiTag />,        path: "/categorias-productos", access: ["ADMIN", "ADMINISTRADOR", "VENTAS", "VENDEDOR", "PRODUCTOS"] },
      { label: "Productos",              icon: <FiPackage />,    path: "/productos", access: ["ADMIN", "ADMINISTRADOR", "VENTAS", "VENDEDOR", "PRODUCTOS"] },
      { label: "Clientes",               icon: <FiUsers />,      path: "/clientes", access: ["ADMIN", "ADMINISTRADOR", "VENTAS", "VENDEDOR", "CLIENTES"] },
      { label: "Pedidos",                icon: <FiHome />,       path: "/pedidos", access: ["ADMIN", "ADMINISTRADOR", "VENTAS", "VENDEDOR", "PEDIDOS"] },
      { label: "Abonos",                 icon: <FiDollarSign />, path: "/abonos", access: ["ADMIN", "ADMINISTRADOR", "VENTAS", "VENDEDOR", "ABONOS"] },
      { label: "Domicilio",              icon: <FiMapPin />,     path: "/domicilio", access: ["ADMIN", "ADMINISTRADOR", "VENTAS", "VENDEDOR", "DOMICILIOS"] },
      { label: "Ventas",                 icon: <FiShoppingBag />, path: "/ventas", access: ["ADMIN", "ADMINISTRADOR", "VENTAS", "VENDEDOR", "VENTAS"] },
      { label: "Órdenes catálogo",       icon: <FiGrid />,       path: "/ordenes-catalogo", access: ["ADMIN", "ADMINISTRADOR", "VENTAS", "VENDEDOR"] },
    ],
  },
];

export default MENU;
