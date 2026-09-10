import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
// Tree-shaking: iconos importados individualmente desde react-icons/fi
import { FiShoppingCart, FiX, FiUser, FiUserPlus, FiGrid, FiPackage, FiLogOut, FiChevronDown } from "react-icons/fi";
import logo from "../../assets/logo_Aroko-removebg-preview.png";
import styles from "./Navbar.module.css";
import { useAuthContext } from "../../context/AuthContext";

const LINKS = [
  { label: "Inicio",    id: "inicio",    route: null        },
  { label: "Catálogo",  id: "catalogo",  route: "/catalogo" },
  { label: "Nosotros",  id: "nosotros",  route: "/nosotros" },
  { label: "Novedades", id: "novedades", route: "/novedades"},
];

function getNombre(user) {
  return user?.nombre_usuario || "Usuario";
}

function getInitials(user) {
  const n = getNombre(user);
  if (!n) return user?.correo?.[0]?.toUpperCase() ?? "?";
  return n.trim().split(" ").filter(Boolean).slice(0, 2)
    .map((w) => w[0].toUpperCase()).join("");
}

function isCliente(user) {
  const rol = (user?.rol ?? user?.nombre_rol ?? "").toUpperCase();
  return rol === "CLIENTE" || rol === "";
}

/* ── ClienteMenu ── */
function ClienteMenu({ user, scrolled, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const nombre   = getNombre(user);
  const correo   = user?.correo || "";
  const initials = getInitials(user);
  const foto     = user?.foto_url || user?.foto || null;

  return (
    <div className={styles.clienteMenu} ref={ref}>
      <button
        className={`${styles.clienteBtn} ${scrolled ? styles.clienteBtnScrolled : ""} ${open ? styles.clienteBtnOpen : ""}`}
        onClick={() => setOpen((o) => !o)}
      >
        <div className={styles.clienteAvatar}>
          {foto
            ? <img src={foto} alt={nombre || correo} className={styles.clienteAvatarImg} width="30" height="30" />
            : <span>{initials}</span>}
        </div>
        <div className={styles.clienteBtnInfo}>
          <span className={styles.clienteNombre}>{nombre || correo}</span>
          {correo && nombre && <span className={styles.clienteCorreo}>{correo}</span>}
        </div>
        <FiChevronDown className={`${styles.clienteChevron} ${open ? styles.clienteChevronOpen : ""}`} />
      </button>

      <div className={`${styles.clienteDropdown} ${open ? styles.clienteDropdownOpen : ""}`}>
        <div className={styles.ddHeader}>
          <div className={styles.ddAvatar}>
            {foto
              ? <img src={foto} alt={nombre} className={styles.clienteAvatarImg} width="36" height="36" />
              : <span>{initials}</span>}
          </div>
          <div className={styles.ddMeta}>
            <p className={styles.ddName}>{nombre || correo}</p>
            {correo && nombre && <p className={styles.ddEmail}>{correo}</p>}
          </div>
        </div>

        <div className={styles.ddDivider} />

        <button className={styles.ddItem} onClick={() => { setOpen(false); navigate("/perfil"); }}>
          <span className={styles.ddItemIcon}><FiUser /></span>
          Mi perfil
        </button>
        <button className={styles.ddItem} onClick={() => { setOpen(false); navigate("/mis-pedidos"); }}>
          <span className={styles.ddItemIcon}><FiPackage /></span>
          Mis pedidos
        </button>

        <div className={styles.ddDivider} />

        <button className={`${styles.ddItem} ${styles.ddItemLogout}`} onClick={() => { setOpen(false); onLogout(); }}>
          <span className={styles.ddItemIcon}><FiLogOut /></span>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

/* ── Navbar ────────────────────────────────────────────────────────────────
   Sin framer-motion: overlay/drawer usan transiciones CSS (montaje diferido),
   el badge usa una animación CSS re-disparada por `key`. Esto saca
   framer-motion (~35 KB gzip) del bundle inicial de la landing. */
export default function Navbar({ cartCount = 0, onCartClick, lightBg = false }) {
  const [scrolled, setScrolled]       = useState(false);
  const [open,     setOpen]           = useState(false);           // estado visual
  const [drawerInDom, setDrawerInDom] = useState(false);           // montaje
  const { user: session, logout } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();

  const isScrolled = scrolled || lightBg;

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    const fn = () => { if (window.innerWidth > 768) closeMenu(); };
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const openMenu = useCallback(() => {
    setDrawerInDom(true);
    // Doble rAF: garantiza que la transición CSS de entrada se dispare
    requestAnimationFrame(() => requestAnimationFrame(() => setOpen(true)));
  }, []);

  const closeMenu = useCallback(() => {
    setOpen(false);
    setTimeout(() => setDrawerInDom(false), 320); // espera la transición de salida
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const handleLink = (link) => {
    closeMenu();
    if (link.route) { navigate(link.route); return; }
    if (location.pathname !== "/" && location.pathname !== "/landing") {
      navigate("/");
      setTimeout(() => document.getElementById(link.id)?.scrollIntoView({ behavior: "smooth" }), 400);
      return;
    }
    setTimeout(() => document.getElementById(link.id)?.scrollIntoView({ behavior: "smooth" }), open ? 320 : 0);
  };

  const esCliente = session && isCliente(session);
  const esAdmin   = session && !isCliente(session);

  return (
    <>
      <nav className={`${styles.nav} ${isScrolled ? styles.scrolled : ""}`}>
        <button className={styles.logoBtn} onClick={() => handleLink({ id: "inicio", route: null })}>
          <img src={logo} alt="Aroko" className={styles.logo} width="285" height="156" />
        </button>

        <ul className={styles.links}>
          {LINKS.map((l) => (
            <li key={l.id}>
              <button className={styles.link} onClick={() => handleLink(l)}>
                {l.label}
                <span className={styles.linkUnderline} />
              </button>
            </li>
          ))}
        </ul>

        <div className={styles.actions}>
          <button className={styles.cartBtn} aria-label="Carrito" onClick={onCartClick}>
            <FiShoppingCart className={styles.cartIcon} />
            {/* key={cartCount} re-monta el badge y re-dispara la animación pop */}
            {cartCount > 0 && (
              <span className={styles.cartBadge} key={cartCount}>
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </button>

          {!session && (
            <>
              <button className={styles.loginBtn} onClick={() => navigate("/login")}>
                <FiUser className={styles.btnIcon} /><span>Ingresar</span>
              </button>
              <button className={styles.registerBtn} onClick={() => navigate("/registro")}>
                <FiUserPlus className={styles.btnIcon} /><span>Registrarse</span>
              </button>
            </>
          )}

          {esCliente && <ClienteMenu user={session} scrolled={isScrolled} onLogout={handleLogout} />}

          {esAdmin && (
            <button className={styles.registerBtn} onClick={() => navigate("/dashboard")}>
              <FiGrid className={styles.btnIcon} /><span>Ir al panel</span>
            </button>
          )}

          <button
            className={`${styles.burger} ${open ? styles.burgerOpen : ""}`}
            onClick={() => (open ? closeMenu() : openMenu())}
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {drawerInDom && (
        <>
          <div
            className={`${styles.overlay} ${open ? styles.overlayOpen : ""}`}
            onClick={closeMenu}
            aria-hidden="true"
          />

          <aside
            className={`${styles.drawer} ${open ? styles.drawerOpen : ""}`}
            aria-hidden={!open}
          >
            <div className={styles.drawerHeader}>
              <img src={logo} alt="Aroko" className={styles.drawerLogo} width="285" height="156" />
              <button className={styles.closeDrawer} onClick={closeMenu} aria-label="Cerrar menú"><FiX /></button>
            </div>

            <nav className={styles.drawerNav}>
              {LINKS.map((l, i) => (
                <button
                  key={l.id}
                  className={styles.drawerLink}
                  style={{ animationDelay: `${i * 0.07 + 0.1}s` }}
                  onClick={() => handleLink(l)}
                  tabIndex={open ? 0 : -1}
                >
                  {l.label}
                </button>
              ))}
            </nav>

            <div className={styles.drawerActions}>
              <button className={styles.drawerCartBtn} onClick={() => { closeMenu(); onCartClick?.(); }} tabIndex={open ? 0 : -1}>
                <FiShoppingCart />Carrito
                {cartCount > 0 && <span className={styles.drawerBadge}>{cartCount}</span>}
              </button>

              {!session && (
                <>
                  <button className={styles.drawerLogin} onClick={() => { closeMenu(); navigate("/login"); }} tabIndex={open ? 0 : -1}>
                    <FiUser /> Ingresar
                  </button>
                  <button className={styles.drawerRegister} onClick={() => { closeMenu(); navigate("/registro"); }} tabIndex={open ? 0 : -1}>
                    <FiUserPlus /> Registrarse
                  </button>
                </>
              )}

              {esCliente && (() => {
                const nombre   = getNombre(session);
                const correo   = session?.correo || "";
                const initials = getInitials(session);
                const foto     = session?.foto_url || session?.foto || null;
                return (
                  <>
                    <div className={styles.drawerProfile}>
                      <div className={styles.drawerProfileAvatar}>
                        {foto
                          ? <img src={foto} alt="" className={styles.clienteAvatarImg} width="38" height="38" />
                          : <span>{initials}</span>}
                      </div>
                      <div className={styles.drawerProfileMeta}>
                        <p className={styles.drawerProfileName}>{nombre || correo}</p>
                        {correo && nombre && <p className={styles.drawerProfileEmail}>{correo}</p>}
                      </div>
                    </div>
                    <button className={styles.drawerLogin} onClick={() => { closeMenu(); navigate("/perfil"); }} tabIndex={open ? 0 : -1}>
                      <FiUser /> Mi perfil
                    </button>
                    <button className={styles.drawerLogin} onClick={() => { closeMenu(); navigate("/mis-pedidos"); }} tabIndex={open ? 0 : -1}>
                      <FiPackage /> Mis pedidos
                    </button>
                    <button className={styles.drawerLogout} onClick={() => { closeMenu(); handleLogout(); }} tabIndex={open ? 0 : -1}>
                      <FiLogOut /> Cerrar sesión
                    </button>
                  </>
                );
              })()}

              {esAdmin && (
                <button className={styles.drawerRegister} onClick={() => { closeMenu(); navigate("/dashboard"); }} tabIndex={open ? 0 : -1}>
                  <FiGrid /> Ir al panel
                </button>
              )}
            </div>
          </aside>
        </>
      )}
    </>
  );
}