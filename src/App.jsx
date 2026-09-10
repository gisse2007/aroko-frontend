import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { AuthProvider, useAuthContext } from "./context/AuthContext";
import { LoadingProvider, useLoading } from "./context/LoadingContext";
import { CartProvider } from "./context/CartContext";
import { LoadingOverlay } from "./components/loading/Loading";
import { setLoadingHandlers } from "./api/axios";
import { canAccessByRole } from "./utils/access";

// ── Rutas críticas: carga inmediata ──────────────────────────────────────────
import LandingPage       from "./pages/landing/LandingPage";
import Login             from "./pages/auth/Login";
import Registro          from "./pages/auth/Registro";
import RecuperarPassword from "./pages/auth/RecuperarPassword";

// ── Rutas lazy: solo se cargan cuando el usuario las visita ──────────────────
const CatalogoPage        = lazy(() => import("./pages/catalogo/CatalogoPage"));
const NosotrosPage        = lazy(() => import("./pages/nosotros/NosotrosPage"));
const NovedadesPage       = lazy(() => import("./pages/novedades/NovedadesPage"));
const PerfilCliente       = lazy(() => import("./pages/perfil/PerfilCliente"));

const DashboardLayout     = lazy(() => import("./layouts/DashboardLayout"));
const DashboardHome       = lazy(() => import("./pages/dashboard/DashboardHome"));
const Empleados           = lazy(() => import("./pages/empleados/Empleados"));
const Roles               = lazy(() => import("./pages/roles/Roles"));
const Proveedores         = lazy(() => import("./pages/compras/Proveedores"));
const Compras             = lazy(() => import("./pages/compras/Compras"));
const Insumos             = lazy(() => import("./pages/compras/Insumos"));
const CategoriasInsumos   = lazy(() => import("./pages/compras/CategoriasInsumos"));
const Salidas             = lazy(() => import("./pages/salidas/Salidas"));
const Produccion          = lazy(() => import("./pages/produccion/Produccion"));
const Pedidos             = lazy(() => import("./pages/pedidos/Pedidos"));
const Clientes            = lazy(() => import("./pages/clientes/Clientes"));
const Abonos              = lazy(() => import("./pages/abonos/Abonos"));
const Devoluciones        = lazy(() => import("./pages/devoluciones/Devoluciones"));
const Ventas              = lazy(() => import("./pages/ventas/Ventas"));
const ProductosPage       = lazy(() => import("./pages/productos/Productos"));
const CategoriasProductos = lazy(() => import("./pages/pedidos/CategoriasProductos"));
const Domicilios          = lazy(() => import("./pages/domicilios/Domicilios"));

function getRol(user) {
  return (user?.rol ?? user?.nombre_rol ?? "").toUpperCase();
}

const Spinner = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "#9ca3af", fontSize: "0.875rem" }}>
    Verificando sesión…
  </div>
);

const PageFallback = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "#9ca3af", fontSize: "0.875rem" }}>
    Cargando…
  </div>
);

function AxiosLoadingBridge() {
  const { incrementHttp, decrementHttp } = useLoading();
  useEffect(() => {
    setLoadingHandlers(incrementHttp, decrementHttp);
  }, [incrementHttp, decrementHttp]);
  return null;
}

function GlobalOverlay() {
  const { overlay } = useLoading();
  return <LoadingOverlay visible={overlay.visible} text={overlay.text} />;
}

function DashboardGuard({ children }) {
  const { user, loading } = useAuthContext();
  if (loading) return <Spinner />;
  if (!user || !localStorage.getItem("token")) return <Navigate to="/login" replace />;
  if (getRol(user) === "CLIENTE") return <Navigate to="/" replace />;
  return children;
}

function RoleRoute({ allowed, children }) {
  const { user, loading } = useAuthContext();
  if (loading) return <Spinner />;
  if (!user || !localStorage.getItem("token")) return <Navigate to="/login" replace />;
  if (!canAccessByRole(user, allowed)) return <Navigate to="/dashboard" replace />;
  return children;
}

function ClienteGuard({ children }) {
  const { user, loading } = useAuthContext();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const { user, logout } = useAuthContext();

  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        {/* Públicas — carga inmediata */}
        <Route path="/"          element={<LandingPage />} />
        <Route path="/landing"   element={<LandingPage />} />
        <Route path="/login"     element={<Login />} />
        <Route path="/registro"  element={<Registro />} />
        <Route path="/recuperar" element={<RecuperarPassword />} />

        {/* Públicas — lazy */}
        <Route path="/catalogo"  element={<CatalogoPage />} />
        <Route path="/nosotros"  element={<NosotrosPage />} />
        <Route path="/temporada" element={<NovedadesPage />} />
        <Route path="/novedades" element={<NovedadesPage />} />

        {/* Perfil cliente */}
        <Route path="/perfil"      element={<ClienteGuard><PerfilCliente /></ClienteGuard>} />
        <Route path="/mis-pedidos" element={<ClienteGuard><PerfilCliente initialTab="pedidos" /></ClienteGuard>} />

        {/* Dashboard */}
        <Route element={<DashboardGuard><DashboardLayout user={user} onLogout={logout} /></DashboardGuard>}>
          <Route path="/dashboard"           element={<DashboardHome />} />
          <Route path="/empleados"            element={<RoleRoute allowed={["ADMIN", "ADMINISTRADOR", "EMPLEADOS", "USUARIOS"]}><Empleados /></RoleRoute>} />
          <Route path="/roles"                element={<RoleRoute allowed={["ADMIN", "ADMINISTRADOR", "ROLES", "USUARIOS"]}><Roles /></RoleRoute>} />
          <Route path="/proveedores"          element={<RoleRoute allowed={["ADMIN", "ADMINISTRADOR", "COMPRAS", "PROVEEDORES"]}><Proveedores /></RoleRoute>} />
          <Route path="/compras"              element={<RoleRoute allowed={["ADMIN", "ADMINISTRADOR", "COMPRAS"]}><Compras /></RoleRoute>} />
          <Route path="/insumos"              element={<RoleRoute allowed={["ADMIN", "ADMINISTRADOR", "COMPRAS", "INSUMOS"]}><Insumos /></RoleRoute>} />
          <Route path="/categorias-insumos"   element={<RoleRoute allowed={["ADMIN", "ADMINISTRADOR", "COMPRAS", "INSUMOS"]}><CategoriasInsumos /></RoleRoute>} />
          <Route path="/salidas-insumos"      element={<RoleRoute allowed={["ADMIN", "ADMINISTRADOR", "COMPRAS", "SALIDAS", "INSUMOS"]}><Salidas /></RoleRoute>} />
          <Route path="/produccion"           element={<RoleRoute allowed={["ADMIN", "ADMINISTRADOR", "PRODUCCION", "PANADERO"]}><Produccion /></RoleRoute>} />
          <Route path="/pedidos"              element={<RoleRoute allowed={["ADMIN", "ADMINISTRADOR", "VENTAS", "VENDEDOR", "PEDIDOS"]}><Pedidos /></RoleRoute>} />
          <Route path="/clientes"             element={<RoleRoute allowed={["ADMIN", "ADMINISTRADOR", "VENTAS", "VENDEDOR", "CLIENTES"]}><Clientes /></RoleRoute>} />
          <Route path="/abonos"               element={<RoleRoute allowed={["ADMIN", "ADMINISTRADOR", "VENTAS", "VENDEDOR", "ABONOS"]}><Abonos /></RoleRoute>} />
          <Route path="/devoluciones"         element={<RoleRoute allowed={["ADMIN", "ADMINISTRADOR", "VENTAS", "VENDEDOR", "DEVOLUCIONES"]}><Devoluciones /></RoleRoute>} />
          <Route path="/ventas"               element={<RoleRoute allowed={["ADMIN", "ADMINISTRADOR", "VENTAS", "VENDEDOR", "VENTAS"]}><Ventas /></RoleRoute>} />
          <Route path="/productos"            element={<RoleRoute allowed={["ADMIN", "ADMINISTRADOR", "VENTAS", "VENDEDOR", "PRODUCTOS"]}><ProductosPage /></RoleRoute>} />
          <Route path="/categorias-productos" element={<RoleRoute allowed={["ADMIN", "ADMINISTRADOR", "VENTAS", "VENDEDOR", "PRODUCTOS"]}><CategoriasProductos /></RoleRoute>} />
          <Route path="/domicilio"            element={<RoleRoute allowed={["ADMIN", "ADMINISTRADOR", "VENTAS", "VENDEDOR", "DOMICILIOS"]}><Domicilios /></RoleRoute>} />
          <Route path="*"                    element={<Navigate to="/dashboard" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

function CartProviderWithAuth({ children }) {
  const { user } = useAuthContext();
  const userId = user?.id_usuario ?? user?.id ?? null;
  return <CartProvider userId={userId}>{children}</CartProvider>;
}

export default function App() {
  return (
    <BrowserRouter>
      <LoadingProvider>
        <AuthProvider>
          <CartProviderWithAuth>
            <AxiosLoadingBridge />
            <GlobalOverlay />
            <AppRoutes />
          </CartProviderWithAuth>
        </AuthProvider>
      </LoadingProvider>
    </BrowserRouter>
  );
}
