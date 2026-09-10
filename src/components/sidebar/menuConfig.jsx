import {
  FiUsers, FiSettings, FiShoppingCart, FiPackage, FiTag,
  FiTruck, FiBarChart2, FiShoppingBag, FiUserCheck,
  FiHome, FiDollarSign, FiMapPin, FiArrowDownCircle, FiGrid,
} from "react-icons/fi";

const MENU = [
  {
    label: "Usuarios",
    icon: <FiUsers />,
    access: ["GESTIONAR_USUARIOS"],
    children: [
      { label: "Roles",     icon: <FiSettings />,  path: "/roles", access: ["GESTIONAR_USUARIOS"] },
      { label: "Empleados", icon: <FiUserCheck />, path: "/empleados", access: ["GESTIONAR_USUARIOS"] },
    ],
  },
  {
    label: "Compras",
    icon: <FiShoppingCart />,
    access: ["GESTIONAR_COMPRAS"],
    children: [
      { label: "Categorías de insumos", icon: <FiTag />,            path: "/categorias-insumos", access: ["GESTIONAR_COMPRAS"] },
      { label: "Insumos",               icon: <FiPackage />,         path: "/insumos", access: ["GESTIONAR_COMPRAS"] },
      { label: "Proveedores",           icon: <FiTruck />,           path: "/proveedores", access: ["GESTIONAR_COMPRAS"] },
      { label: "Compras",               icon: <FiShoppingCart />,    path: "/compras", access: ["GESTIONAR_COMPRAS"] },
      { label: "Salidas de insumos",    icon: <FiArrowDownCircle />, path: "/salidas-insumos", access: ["GESTIONAR_COMPRAS"] },
    ],
  },
  {
    label: "Producción",
    icon: <FiBarChart2 />,
    access: ["GESTIONAR_PRODUCCION"],
    children: [
      { label: "Producción", icon: <FiBarChart2 />, path: "/produccion", access: ["GESTIONAR_PRODUCCION"] },
    ],
  },
  {
    label: "Ventas",
    icon: <FiShoppingBag />,
    access: ["GESTIONAR_VENTAS", "GESTIONAR_PEDIDOS", "GESTIONAR_DOMICILIOS"],
    children: [
      { label: "Categoría de productos", icon: <FiTag />,        path: "/categorias-productos", access: ["GESTIONAR_VENTAS"] },
      { label: "Productos",              icon: <FiPackage />,    path: "/productos", access: ["GESTIONAR_VENTAS"] },
      { label: "Clientes",               icon: <FiUsers />,      path: "/clientes", access: ["GESTIONAR_VENTAS"] },
      { label: "Pedidos",                icon: <FiHome />,       path: "/pedidos", access: ["GESTIONAR_PEDIDOS"] },
      { label: "Abonos",                 icon: <FiDollarSign />, path: "/abonos", access: ["GESTIONAR_VENTAS"] },
      { label: "Domicilio",              icon: <FiMapPin />,     path: "/domicilio", access: ["GESTIONAR_DOMICILIOS"] },
      { label: "Ventas",                 icon: <FiShoppingBag />, path: "/ventas", access: ["GESTIONAR_VENTAS"] },
      { label: "Órdenes catálogo",       icon: <FiGrid />,       path: "/ordenes-catalogo", access: ["GESTIONAR_VENTAS"] },
    ],
  },
];

export default MENU;
