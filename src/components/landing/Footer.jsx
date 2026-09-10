import { FiInstagram, FiFacebook, FiMapPin, FiPhone, FiMail } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo_Aroko-removebg-preview.png";
import styles from "./Footer.module.css";

const SOCIAL_LINKS = {
  instagram: "https://instagram.com/aroko",
  facebook:  "https://facebook.com/aroko",
};

const NAV_ITEMS = [
  { label: "Inicio",    action: "scroll", target: "inicio"    },
  { label: "Catálogo",  action: "route",  target: "/catalogo" },
  { label: "Novedades", action: "scroll", target: "novedades" },
  { label: "Temporada", action: "route",  target: "/temporada" },
  { label: "Nosotros",  action: "route",  target: "/nosotros" },
];

export default function Footer() {
  const navigate = useNavigate();

  const handleNav = ({ action, target }) => {
    if (action === "route") {
      navigate(target);
    } else {
      const el = document.getElementById(target);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      } else {
        // Si no estamos en la landing, navegar primero y luego hacer scroll
        navigate("/");
        setTimeout(() => document.getElementById(target)?.scrollIntoView({ behavior: "smooth" }), 400);
      }
    }
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          {/* Dimensiones intrínsecas explícitas: evita CLS */}
          <img src={logo} alt="Aroko" className={styles.logo} width="285" height="156" />
          <p className={styles.tagline}>
            Panadería y repostería artesanal hecha con ingredientes premium y amor genuino.
          </p>
          <div className={styles.socials}>
            <a
              href={SOCIAL_LINKS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className={styles.social}
            >
              <FiInstagram />
            </a>
            <a
              href={SOCIAL_LINKS.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className={styles.social}
            >
              <FiFacebook />
            </a>
          </div>
        </div>

        <div className={styles.col}>
          <h4 className={styles.colTitle}>Navegación</h4>
          <ul className={styles.list}>
            {NAV_ITEMS.map((item) => (
              <li key={item.label}>
                <button className={styles.link} onClick={() => handleNav(item)}>
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.col}>
          <h4 className={styles.colTitle}>Contacto</h4>
          <ul className={styles.list}>
            <li className={styles.contact}>
              <FiMapPin className={styles.icon} />
              <span>Calle 45 #12-34, Bogotá</span>
            </li>
            <li className={styles.contact}>
              <FiPhone className={styles.icon} />
              <a href="tel:+573001234567" className={styles.contactLink}>+57 300 123 4567</a>
            </li>
            <li className={styles.contact}>
              <FiMail className={styles.icon} />
              <a href="mailto:hola@aroko.co" className={styles.contactLink}>hola@aroko.co</a>
            </li>
          </ul>
        </div>
      </div>

      <div className={styles.bottom}>
        <p>© {new Date().getFullYear()} Aroko. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
