import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowLeft } from "react-icons/fi";
import AuthLayout from "../../layouts/AuthLayout";
import SplitAuthLayout from "../../layouts/SplitAuthLayout";
import styles from "./Auth.module.css";
import api from "../../api/axios";
import { useAuthContext } from "../../context/AuthContext";
import { normalizeUser } from "../../utils/normalizeUser";
import { BtnLoading } from "../../components/loading/Loading";

// Unsplash: postre gourmet, iluminación oscura cálida, protagonista al centro
// auto=format sirve AVIF/WebP; w=900,q=80 equilibra nitidez y peso para panel 50 vw
const LOGIN_IMG =
  "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=900&q=80";


export default function Login() {
  const { setUser } = useAuthContext();
  const navigate    = useNavigate();

  const [correo,     setCorreo]     = useState("");
  const [contrasena, setContrasena] = useState("");
  const [showPass,   setShowPass]   = useState(false);
  const [error,      setError]      = useState("");
  const [errorType,  setErrorType]  = useState("error");
  const [loading,    setLoading]    = useState(false);

  const setErr = (msg, type = "error") => { setError(msg); setErrorType(type); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    if (!correo.trim())     { setErr("El correo es obligatorio.");     return; }
    if (!contrasena.trim()) { setErr("La contraseña es obligatoria."); return; }

    setLoading(true);
    try {
      sessionStorage.removeItem("aroko.authme");
      const { data } = await api.post("/auth/login", { correo: correo.trim(), contrasena });

      // ── 200 OK: admin / empleado / panadero / repartidor ──
      // El backend devuelve { token, usuario: { id_usuario, nombre_usuario, correo, rol/nombre_rol, ... } }
      const usuario = data.usuario ?? data;
      localStorage.setItem("token", data.token);
      setUser(usuario); // setUser llama normalizeUser internamente
      navigate("/dashboard", { replace: true });

    } catch (err) {
      const status    = err.response?.status;
      const resData   = err.response?.data ?? {};
      const rolNombre = (resData.rol_nombre ?? "").toUpperCase();

      // ── 403 + CLIENTE: credenciales válidas, sin acceso al panel ──
      if (status === 403 && rolNombre === "CLIENTE") {
        const token   = resData.token ?? null;
        // normalizeUser resuelve nombre_usuario desde cualquier campo del backend
        const usuario = normalizeUser(resData.usuario ?? {
          correo:        correo.trim(),
          nombre_usuario: resData.nombre_usuario || null,
          rol:           "CLIENTE",
          rol_nombre:    resData.rol_nombre || "Cliente",
          id_usuario:    resData.id_usuario ?? resData.id ?? null,
        });

        if (token) localStorage.setItem("token", token);
        else       localStorage.removeItem("token");

        setUser(usuario);

        // Enriquecer en segundo plano si hay token
        if (token) {
          api.get("/auth/me")
            .then(({ data: meData }) => setUser(meData.usuario ?? meData))
            .catch(() => {});
        }

        navigate("/landing", { replace: true });
        return;
      }

      // ── 403 sin rol cliente: cuenta inactiva ──
      if (status === 403) {
        setErr(resData.message || "Tu cuenta está inactiva. Contacta al administrador.", "warning");
        return;
      }

      setErr(resData.message || "Correo o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SplitAuthLayout image={LOGIN_IMG} tagline="El sabor de lo artesanal">
      <div style={{ marginBottom: "16px" }}>
        <Link to="/" className={styles.backLink}>
          <FiArrowLeft />
          Volver al inicio
        </Link>
      </div>

      <h2 className={styles.title}>Iniciar sesión</h2>
      <p className={styles.subtitle}>Ingresa tus credenciales para continuar</p>

      <form onSubmit={handleSubmit} noValidate className={styles.form}>

        <div className={styles.field}>
          <label className={styles.label}>Correo electrónico</label>
          <div className={styles.inputWrap}>
            <FiMail className={styles.inputIcon} />
            <input
              type="email"
              className={styles.input}
              placeholder="correo@aroko.com"
              value={correo}
              onChange={(e) => { setCorreo(e.target.value); setErr(""); }}
              autoComplete="email"
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Contraseña</label>
          <div className={styles.inputWrap}>
            <FiLock className={styles.inputIcon} />
            <input
              type={showPass ? "text" : "password"}
              className={styles.input}
              placeholder="••••••••"
              value={contrasena}
              onChange={(e) => { setContrasena(e.target.value); setErr(""); }}
              autoComplete="current-password"
            />
            <button type="button" className={styles.eyeBtn} onClick={() => setShowPass((s) => !s)}>
              {showPass ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
        </div>

        {error && (
          <p className={errorType === "warning" ? styles.errorWarning : styles.error}>
            ⚠ {error}
          </p>
        )}

        <div className={styles.forgotWrap}>
          <Link to="/recuperar" className={styles.forgotLink}>¿Olvidaste tu contraseña?</Link>
        </div>

        <BtnLoading
          type="submit"
          className={styles.submitBtn}
          loading={loading}
          loadingText="Iniciando sesión..."
        >
          Ingresar
        </BtnLoading>

      </form>

      <p style={{ textAlign: "center", marginTop: 16, fontSize: "0.82rem", color: "#888" }}>
        ¿No tienes cuenta?{" "}
        <Link to="/registro" className={styles.forgotLink}>Regístrate</Link>
      </p>

    </SplitAuthLayout>
  );
}
