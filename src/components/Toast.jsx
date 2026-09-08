import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from "react-icons/fi";
import styles from "./Toast.module.css";

const ICONS = {
  success: <FiCheckCircle />,
  error:   <FiAlertCircle />,
  info:    <FiInfo />,
};

export default function Toast({ toast, onHide }) {
  if (!toast) return null;
  return (
    <div className={`${styles.toast} ${styles[toast.type]}`}>
      <span className={styles.icon}>{ICONS[toast.type]}</span>
      <span className={styles.message}>{toast.message}</span>
      <button className={styles.close} onClick={onHide}><FiX /></button>
    </div>
  );
}
