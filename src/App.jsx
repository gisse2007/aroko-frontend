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
const Ventas              = lazy(() => import("./pages/ventas/Ventas"));
const ProductosPage       = lazy(() => import("./pages/productos/Productos"));
const CategoriasProductos = lazy(() => import("./pages/pedidos/CategoriasProductos"));
const Domicilios          = lazy(() => import("./pages/domicilios/Domicilios"));
const AdminOrders         = lazy(() => import("./pages/admin/AdminOrders"));

function getRol(user) {
  return String(user?.rol ?? user?.nombre_rol ?? "").trim().toUpperCase();
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
  if (getRol(user) === "CLIENTE") return <Navigate to="/landing" replace />;
  if (!canAccessByRole(user, [
    "VER_DASHBOARD",
    "GESTIONAR_USUARIOS",
    "GESTIONAR_VENTAS",
    "GESTIONAR_COMPRAS",
    "GESTIONAR_PRODUCCION",
    "GESTIONAR_PEDIDOS",
    "GESTIONAR_DOMICILIOS",
  ])) return <Navigate to="/landing" replace />;
  return children;
}

function RoleRoute({ allowed, children }) {
  const { user, loading } = useAuthContext();
  if (loading) return <Spinner />;
  if (!user || !localStorage.getItem("token")) return <Navigate to="/login" replace />;
  if (!canAccessByRole(user, allowed)) {
    const fallback = canAccessByRole(user, ["VER_DASHBOARD"]) ? "/dashboard" : "/landing";
    return <Navigate to={fallback} replace />;
  }
  return children;
}

function ClienteGuard({ children }) {
  const { user, loading } = useAuthContext();
  if (loading) return <Spinner />;
  if (!user || !localStorage.getItem("token")) return <Navigate to="/login" replace />;
  if (getRol(user) !== "CLIENTE") return <Navigate to="/dashboard" replace />;
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
          <Route path="/dashboard"           element={<RoleRoute allowed={["VER_DASHBOARD"]}><DashboardHome /></RoleRoute>} />
          <Route path="/empleados"            element={<RoleRoute allowed={["GESTIONAR_USUARIOS"]}><Empleados /></RoleRoute>} />
          <Route path="/roles"                element={<RoleRoute allowed={["GESTIONAR_USUARIOS"]}><Roles /></RoleRoute>} />
          <Route path="/proveedores"          element={<RoleRoute allowed={["GESTIONAR_COMPRAS"]}><Proveedores /></RoleRoute>} />
          <Route path="/compras"              element={<RoleRoute allowed={["GESTIONAR_COMPRAS"]}><Compras /></RoleRoute>} />
          <Route path="/insumos"              element={<RoleRoute allowed={["GESTIONAR_COMPRAS"]}><Insumos /></RoleRoute>} />
          <Route path="/categorias-insumos"   element={<RoleRoute allowed={["GESTIONAR_COMPRAS"]}><CategoriasInsumos /></RoleRoute>} />
          <Route path="/salidas-insumos"      element={<RoleRoute allowed={["GESTIONAR_COMPRAS"]}><Salidas /></RoleRoute>} />
          <Route path="/produccion"           element={<RoleRoute allowed={["GESTIONAR_PRODUCCION"]}><Produccion /></RoleRoute>} />
          <Route path="/pedidos"              element={<RoleRoute allowed={["GESTIONAR_PEDIDOS"]}><Pedidos /></RoleRoute>} />
          <Route path="/clientes"             element={<RoleRoute allowed={["GESTIONAR_VENTAS"]}><Clientes /></RoleRoute>} />
          <Route path="/abonos"               element={<RoleRoute allowed={["GESTIONAR_VENTAS"]}><Abonos /></RoleRoute>} />
          <Route path="/ventas"               element={<RoleRoute allowed={["GESTIONAR_VENTAS"]}><Ventas /></RoleRoute>} />
          <Route path="/productos"            element={<RoleRoute allowed={["GESTIONAR_VENTAS"]}><ProductosPage /></RoleRoute>} />
          <Route path="/categorias-productos" element={<RoleRoute allowed={["GESTIONAR_VENTAS"]}><CategoriasProductos /></RoleRoute>} />
          <Route path="/domicilio"            element={<RoleRoute allowed={["GESTIONAR_DOMICILIOS"]}><Domicilios /></RoleRoute>} />
          <Route path="/ordenes-catalogo"     element={<RoleRoute allowed={["GESTIONAR_VENTAS"]}><AdminOrders /></RoleRoute>} />
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
