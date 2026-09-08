import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../components/sidebar/Sidebar";
import Header from "../components/header/Header";
import styles from "./DashboardLayout.module.css";
import { useAuthContext } from "../context/AuthContext";

export default function DashboardLayout({ onLogout }) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const handleLogout = () => {
    // Limpia token/usuario y el estado global de autenticación
    onLogout?.();
    // Redirigir siempre a la landing después de cerrar sesión
    navigate("/landing", { replace: true });
  };

  return (
    <div className={styles.layout}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} user={user} />
      <div className={styles.main}>
        <Header user={user} onLogout={handleLogout} />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
