import { useEffect, useRef, useState } from "react";
import { FiChevronDown, FiUser, FiBell, FiLogOut, FiGrid } from "react-icons/fi";
import Modal from "../forms/Modal";
import UsuarioForm from "../usuarios/UsuarioForm";
import api from "../../api/axios";
import styles from "./Header.module.css";
import { resolveImageUrl } from "../../utils/image";

function getInitials(name = "") {
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function getRoleLabel(rol) {
  const map = {
    administrador: "Administrador",
    admin: "Administrador",
    cliente: "Cliente",
    empleado: "Empleado",
    vendedor: "Vendedor",
  };
  return map[rol?.toLowerCase()] ?? "Usuario";
}

export default function Header({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  const menuRef = useRef(null);

  const nombre = user?.nombre_usuario || user?.nombre || "Usuario";
  const initials = getInitials(nombre);
  const role = getRoleLabel(user?.rol || user?.nombre_rol);
  const foto = user?.foto_url || user?.foto || null;
  const fotoUrl = resolveImageUrl(foto);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleUpdateProfile = async (values) => {
    try {
      await api.put(`/usuarios/${user.id_usuario}`, values);
      localStorage.setItem("usuario", JSON.stringify({ ...user, ...values }));
      window.location.reload();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <header className={styles.header}>
        <div className={styles.titleBlock}>
          <div className={styles.titleRow}>
            <FiGrid className={styles.titleIcon} />
            <h1 className={styles.title}>Centro de Control</h1>
          </div>
          <p className={styles.subtitle}>Administra y supervisa la información del sistema</p>
        </div>

        <div className={styles.userMenu} ref={menuRef}>
          <button
            className={`${styles.userBtn} ${open ? styles.userBtnActive : ""}`}
            onClick={() => setOpen(!open)}
          >
            <div className={styles.avatar}>
              {fotoUrl ? (
                <img src={fotoUrl} alt={nombre} className={styles.avatarImg} />
              ) : (
                <span className={styles.avatarInitials}>{initials}</span>
              )}
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{nombre}</span>
              <span className={styles.userRole}>{role}</span>
            </div>
            <FiChevronDown
              className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`}
            />
          </button>

          <div className={`${styles.dropdown} ${open ? styles.dropdownOpen : ""}`}>
            <div className={styles.dropdownHeader}>
              <div className={styles.avatarLg}>
                {fotoUrl ? (
                  <img src={fotoUrl} alt={nombre} className={styles.avatarImg} />
                ) : (
                  <span className={styles.avatarInitials}>{initials}</span>
                )}
              </div>
              <div>
                <p className={styles.dropdownName}>{nombre}</p>
                <p className={styles.dropdownRole}>{role}</p>
              </div>
            </div>

            <div className={styles.dropdownDivider} />

            <button
              className={styles.dropdownItem}
              onClick={() => { setOpen(false); setOpenProfile(true); }}
            >
              <span className={styles.itemIcon}><FiUser /></span>
              Editar perfil
            </button>

            <button className={styles.dropdownItem}>
              <span className={styles.itemIcon}><FiBell /></span>
              Notificaciones
            </button>

            <div className={styles.dropdownDivider} />

            <button className={styles.dropdownItemLogout} onClick={onLogout}>
              <span className={styles.itemIcon}><FiLogOut /></span>
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <Modal open={openProfile} onClose={() => setOpenProfile(false)} title="Editar perfil">
        <UsuarioForm
          defaultValues={user}
          isEdit
          isProfile
          onSubmit={handleUpdateProfile}
          onCancel={() => setOpenProfile(false)}
          submitLabel="Guardar cambios"
        />
      </Modal>
    </>
  );
}