import { useState, useEffect } from "react";
import { FiMenu, FiX, FiExternalLink } from "react-icons/fi";
import { Link } from "react-router-dom";
import MENU from "./menuConfig";
import SidebarItem from "./SidebarItem";
import logo from "../../assets/logo_Aroko-removebg-preview.png";
import styles from "./Sidebar.module.css";
import { filterMenuByUser } from "../../utils/access";

export default function Sidebar({ collapsed, onToggle, user }) {
  const [openedMenuKey, setOpenedMenuKey] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleMenuToggle = (key) => {
    setOpenedMenuKey((current) => (current === key ? null : key));
  };

  const handleNavigate = () => {
    if (isMobile && !collapsed) {
      onToggle(); // Colapsar sidebar en móviles
      setOpenedMenuKey(null); // Cerrar acordeón
    }
  };

  const filteredMenu = filterMenuByUser(MENU, user);

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
      <div className={styles.sidebarHeader}>
        {!collapsed && <img src={logo} alt="Aroko" className={styles.logo} />}
        <button className={styles.toggleBtn} onClick={onToggle}>
          {collapsed ? <FiMenu /> : <FiX />}
        </button>
      </div>
      <nav style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        <ul className={styles.menu}>
          {filteredMenu.map((item) => (
            <SidebarItem 
              key={item.label} 
              item={item} 
              collapsed={collapsed}
              openedKey={openedMenuKey}
              onToggle={handleMenuToggle}
              onNavigate={handleNavigate}
            />
          ))}
        </ul>
      </nav>

      <div className={styles.landingWrap}>
        <Link 
          to="/landing" 
          className={styles.landingBtn} 
          title="Ir al inicio"
          onClick={handleNavigate}
        >
          <FiExternalLink className={styles.landingIcon} />
          {!collapsed && <span>Ir al inicio</span>}
        </Link>
      </div>
    </aside>
  );
}
