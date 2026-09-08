import logo from "../assets/logo_Aroko-removebg-preview.png";
import styles from "./AuthLayout.module.css";

export default function AuthLayout({ children }) {
  return (
    <div className={styles.bg}>
      <div className={styles.card}>
        <div className={styles.logoWrap}>
          <img src={logo} alt="Aroko" className={styles.logo} />
        </div>
        {children}
      </div>
    </div>
  );
}
