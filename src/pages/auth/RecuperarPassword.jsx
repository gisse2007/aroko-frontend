import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiMail,
  FiArrowLeft,
  FiLock,
  FiKey,
} from "react-icons/fi";

import AuthLayout from "../../layouts/AuthLayout";
import styles from "./Auth.module.css";
import api from "../../api/axios";

export default function RecuperarPassword() {

  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const [correo, setCorreo] = useState("");
  const [codigo, setCodigo] = useState("");
  const [nuevaContrasena, setNuevaContrasena] = useState("");

  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ─────────────────────────────
  // ENVIAR CÓDIGO
  // ─────────────────────────────
  const enviarCodigo = async (e) => {

    e.preventDefault();

    setError("");
    setMsg("");

    try {

      setLoading(true);

      const { data } = await api.post("/auth/recuperar", {
        correo,
      });

      if (data?.ok === false) {
        setError(data.message || "Error al enviar código.");
        return;
      }

      setMsg("Código enviado correctamente.");
      setStep(2);

    } catch (err) {

      setError(err.response?.data?.message || "Error al enviar código.");

    } finally {

      setLoading(false);
    }
  };

  // ─────────────────────────────
  // CAMBIAR PASSWORD
  // ─────────────────────────────
  const cambiarPassword = async (e) => {

    e.preventDefault();

    setError("");
    setMsg("");

    try {

      setLoading(true);

      const { data } = await api.post("/auth/reset-password", {
        codigo,
        nuevaContrasena,
      });

      if (data?.ok === false) {
        setError(data.message || "Error al cambiar contraseña.");
        return;
      }

      setMsg("Contraseña actualizada correctamente.");
      setTimeout(() => navigate("/login", { replace: true }), 1200);

    } catch (err) {

      setError(err.response?.data?.message || "Error al cambiar contraseña.");

    } finally {

      setLoading(false);
    }
  };

  return (

    <AuthLayout>

      <h2 className={styles.title}>
        Recuperar contraseña
      </h2>

      <p className={styles.subtitle}>
        {step === 1
          ? "Ingresa tu correo y te enviaremos un código"
          : "Ingresa el código y tu nueva contraseña"}
      </p>

      <div className={styles.stepper} aria-label={`Paso ${step} de 2`}>
        <span className={`${styles.step} ${step >= 1 ? styles.stepActive : ""}`}>1</span>
        <span className={styles.stepLine} />
        <span className={`${styles.step} ${step >= 2 ? styles.stepActive : ""}`}>2</span>
      </div>

      <form
        onSubmit={
          step === 1
            ? enviarCodigo
            : cambiarPassword
        }
        className={styles.form}
      >

        {/* PASO 1 */}
        {step === 1 && (

          <div className={styles.field}>

            <label className={styles.label}>
              Correo electrónico
            </label>

            <div className={styles.inputWrap}>
              <FiMail className={styles.inputIcon} />

              <input
                type="email"
                className={styles.input}
                placeholder="correo@aroko.com"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
              />
            </div>

          </div>
        )}

        {/* PASO 2 */}
        {step === 2 && (

          <>
            <div className={styles.field}>

              <label className={styles.label}>
                Código
              </label>

              <div className={styles.inputWrap}>
                <FiKey className={styles.inputIcon} />

                <input
                  type="text"
                  className={styles.input}
                  placeholder="123456"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                />
              </div>

            </div>

            <div className={styles.field}>

              <label className={styles.label}>
                Nueva contraseña
              </label>

              <div className={styles.inputWrap}>
                <FiLock className={styles.inputIcon} />

                <input
                  type="password"
                  className={styles.input}
                  placeholder="Nueva contraseña"
                  value={nuevaContrasena}
                  onChange={(e) =>
                    setNuevaContrasena(e.target.value)
                  }
                />
              </div>

            </div>
          </>
        )}

        {error && (
          <p className={styles.error}>
            ⚠ {error}
          </p>
        )}

        {msg && (
          <p className={styles.success}>
             {msg}
          </p>
        )}

        <button
          type="submit"
          className={styles.submitBtn}
          disabled={loading}
        >
          {loading
            ? "Procesando..."
            : step === 1
            ? "Enviar código"
            : "Cambiar contraseña"}
        </button>

        <Link
          to="/login"
          className={styles.backLink}
        >
          <FiArrowLeft />
          Volver al inicio de sesión
        </Link>

      </form>

    </AuthLayout>
  );
}