import { NavLink } from "react-router-dom";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";
import styles from "./Sidebar.module.css";

export default function SidebarItem({ item, collapsed, openedKey, onToggle, onNavigate }) {
  // Para items con children, usar openedKey para determinar si está abierto
  const isOpen = item.children ? openedKey === item.label : false;
  if (item.children) {
    const handleClick = () => {
      if (isOpen) {
        // Si ya está abierto, cerrarlo
        onToggle(null);
      } else {
        // Si no está abierto, abrirlo (y cerrar otros automáticamente)
        onToggle(item.label);
      }
    };

    return (
      <li>
        <button
          className={`${styles.menuBtn} ${isOpen ? styles.menuBtnActive : ""}`}
          onClick={handleClick}
          title={collapsed ? item.label : undefined}
        >
          <span className={styles.icon}>{item.icon}</span>
          {!collapsed && <span className={styles.label}>{item.label}</span>}
          {!collapsed && (
            <span className={styles.chevron}>
              {isOpen ? <FiChevronDown /> : <FiChevronRight />}
            </span>
          )}
        </button>
        {isOpen && !collapsed && (
          <ul className={styles.submenu}>
            {item.children.map((child) => (
              <li key={child.path}>
                <NavLink
                  to={child.path}
                  className={({ isActive }) =>
                    `${styles.subLink} ${isActive ? styles.active : ""}`
                  }
                  onClick={() => {
                    // En móviles, cerrar sidebar y acordeón al navegar
                    if (typeof window !== "undefined" && window.innerWidth <= 768) {
                      onNavigate?.();
                    }
                  }}
                >
                  <span className={styles.icon}>{child.icon}</span>
                  <span>{child.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  }

  return (
    <li>
      <NavLink
        to={item.path}
        className={({ isActive }) =>
          `${styles.menuBtn} ${isActive ? styles.active : ""}`
        }
        title={collapsed ? item.label : undefined}
        onClick={() => {
          // En móviles, cerrar sidebar al navegar
          if (typeof window !== "undefined" && window.innerWidth <= 768) {
            onNavigate?.();
          }
        }}
      >
        <span className={styles.icon}>{item.icon}</span>
        {!collapsed && <span className={styles.label}>{item.label}</span>}
      </NavLink>
    </li>
  );
}
