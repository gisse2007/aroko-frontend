import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiPhone, FiCreditCard } from "react-icons/fi";
import AuthLayout from "../../layouts/AuthLayout";
import SplitAuthLayout from "../../layouts/SplitAuthLayout";
import styles from "./Auth.module.css";
import api from "../../api/axios";
import { useAuthContext } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";
import Toast from "../../components/Toast";

// Unsplash: pan artesanal rústico, luz natural cálida, panadería gourmet
const REGISTRO_IMG =
  "https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&w=900&q=80";


const TIPOS_DOCUMENTO = ["CC", "TI", "CE", "Pasaporte"];

export default function Registro() {
  const navigate = useNavigate();
  const { setUser } = useAuthContext();

  const [form, setForm] = useState({
    nombre:          "",
    correo:          "",
    telefono:        "",
    tipo_documento:  "",
    documento:       "",
    contrasena:      "",
    confirmar:       "",
  });

  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const { toast, show, hide } = useToast();

  const set = (key) => (e) => {
    const value = key === "telefono"
      ? e.target.value.replace(/\D/g, "").slice(0, 10)
      : key === "documento"
        ? e.target.value.replace(/\D/g, "").slice(0, 11)
        : e.target.value;

    if (key === "telefono" && value.length === 10) {
      show("El teléfono no puede exceder 10 dígitos.", "info");
    }

    if (key === "documento" && value.length === 11) {
      show("El número de documento no puede exceder 11 dígitos.", "info");
    }

    setForm((f) => ({ ...f, [key]: value }));
    setError("");
  };

  const validate = () => {
    if (!form.nombre.trim())
      return "El nombre completo es obligatorio.";
    if (!form.correo.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo))
      return "Ingresa un correo electrónico válido.";
    if (!form.tipo_documento)
      return "Selecciona un tipo de documento.";
    if (form.telefono && !/^\d{1,10}$/.test(form.telefono))
      return "El teléfono debe tener máximo 10 dígitos.";
    if (!form.documento.trim() || !/^\d{1,11}$/.test(form.documento.trim()))
      return "El número de documento debe ser numérico (máx. 11 dígitos).";
    if (!form.contrasena || form.contrasena.length < 6)
      return "La contraseña debe tener al menos 6 caracteres.";
    if (form.contrasena !== form.confirmar)
      return "Las contraseñas no coinciden.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) return setError(err);

    setLoading(true);
    try {
      const body = {
        nombre:         form.nombre.trim(),
        email:          form.correo.trim().toLowerCase(),
        telefono:       form.telefono.trim(),
        tipo_documento: form.tipo_documento,
        documento:      form.documento.trim(),
        password:       form.contrasena,
      };
      console.log("[Registro] body enviado →", body);
      const { data } = await api.post("/auth/register", body);
      // Guardar sesión si el backend devuelve token + usuario
      if (data?.token) {
        localStorage.setItem("token", data.token);
        setUser(data.usuario ?? data);
      }
      navigate("/landing");
    } catch (err) {
      setError(err.response?.data?.message || "Error al crear la cuenta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SplitAuthLayout image={REGISTRO_IMG} tagline="Tu próximo favorito te espera">
      <div style={{ marginBottom: "16px" }}>
        <Link to="/" className={styles.backLink}>
          ← Volver al inicio
        </Link>
      </div>

      <h2 className={styles.title}>Crear cuenta</h2>
      <p className={styles.subtitle}>Únete a Aroko y disfruta nuestros productos</p>

      <Toast toast={toast} onHide={hide} />

      <form onSubmit={handleSubmit} noValidate className={styles.form}>

        {/* Nombre completo */}
        <div className={styles.field}>
          <label className={styles.label}>Nombre completo</label>
          <div className={styles.inputWrap}>
            <FiUser className={styles.inputIcon} />
            <input
              type="text"
              className={styles.input}
              placeholder="Tu nombre completo"
              value={form.nombre}
              onChange={set("nombre")}
            />
          </div>
        </div>

        {/* Correo */}
        <div className={styles.field}>
          <label className={styles.label}>Correo electrónico</label>
          <div className={styles.inputWrap}>
            <FiMail className={styles.inputIcon} />
            <input
              type="email"
              className={styles.input}
              placeholder="correo@aroko.com"
              value={form.correo}
              onChange={set("correo")}
            />
          </div>
        </div>

        {/* Teléfono */}
        <div className={styles.field}>
          <label className={styles.label}>Teléfono (opcional)</label>
          <div className={styles.inputWrap}>
            <FiPhone className={styles.inputIcon} />
            <input
              type="tel"
              className={styles.input}
              placeholder="300 000 0000"
              inputMode="numeric"
              maxLength={10}
              value={form.telefono}
              onChange={set("telefono")}
            />
          </div>
        </div>

        {/* Tipo y número de documento en fila */}
        <div className={styles.docRow}>
          <div className={styles.field}>
            <label className={styles.label}>Tipo de documento</label>
            <select
              className={styles.select}
              value={form.tipo_documento}
              onChange={set("tipo_documento")}
            >
              <option value="">Seleccionar</option>
              {TIPOS_DOCUMENTO.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className={styles.field} style={{ flex: 1 }}>
            <label className={styles.label}>Número de documento</label>
            <div className={styles.inputWrap}>
              <FiCreditCard className={styles.inputIcon} />
              <input
                type="text"
                inputMode="numeric"
                className={styles.input}
                placeholder="Ej: 1234567890"
                maxLength={11}
                value={form.documento}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 11);
                  if (val.length === 11) {
                    show("El número de documento no puede exceder 11 dígitos.", "info");
                  }
                  setForm((f) => ({ ...f, documento: val }));
                  setError("");
                }}
              />
            </div>
          </div>
        </div>

        {/* Contraseña */}
        <div className={styles.field}>
          <label className={styles.label}>Contraseña</label>
          <div className={styles.inputWrap}>
            <FiLock className={styles.inputIcon} />
            <input
              type={showPass ? "text" : "password"}
              className={styles.input}
              placeholder="Mínimo 6 caracteres"
              value={form.contrasena}
              onChange={set("contrasena")}
            />
            <button type="button" className={styles.eyeBtn} onClick={() => setShowPass((s) => !s)}>
              {showPass ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
        </div>

        {/* Confirmar contraseña */}
        <div className={styles.field}>
          <label className={styles.label}>Confirmar contraseña</label>
          <div className={styles.inputWrap}>
            <FiLock className={styles.inputIcon} />
            <input
              type={showPass ? "text" : "password"}
              className={styles.input}
              placeholder="Repite tu contraseña"
              value={form.confirmar}
              onChange={set("confirmar")}
            />
          </div>
        </div>

        {error && <p className={styles.error}>⚠ {error}</p>}

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? "Creando cuenta…" : "Registrarse"}
        </button>
      </form>

      <p style={{ textAlign: "center", marginTop: 16, fontSize: "0.82rem", color: "#888" }}>
        ¿Ya tienes cuenta?{" "}
        <Link to="/login" className={styles.forgotLink}>Inicia sesión</Link>
      </p>
    </SplitAuthLayout>
  );
}
