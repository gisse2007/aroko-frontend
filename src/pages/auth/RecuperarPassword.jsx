import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiMail,
  FiArrowLeft,
  FiLock,
  FiKey
} from "react-icons/fi";

import AuthLayout from "../../layouts/AuthLayout";
import styles from "./Auth.module.css";

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

      const response = await fetch(
        "http://localhost:3000/api/auth/recuperar",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            correo,
          }),
        }
      );

      const data = await response.json();

      if (!data.ok) {
        setError(data.message);
        return;
      }

      setMsg("Código enviado correctamente.");
      setStep(2);

    } catch {

      setError("Error al enviar código.");

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

      const response = await fetch(
        "http://localhost:3000/api/auth/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            codigo,
            nuevaContrasena,
          }),
        }
      );

      const data = await response.json();

      if (!data.ok) {
        setError(data.message);
        return;
      }

      setMsg("Contraseña actualizada correctamente.");
      setTimeout(() => navigate("/login", { replace: true }), 1200);

    } catch {

      setError("Error al cambiar contraseña.");

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