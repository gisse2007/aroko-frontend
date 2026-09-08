import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../api/axios";
import { normalizeUser } from "../utils/normalizeUser";
import { whenIdle, cancelIdle } from "../utils/idle";

const AuthContext = createContext(null);

// Cache de sesión para /auth/me: evita repetir la petición en cada
// navegación/recarga dentro de la misma pestaña (TTL 5 min).
const AUTH_ME_CACHE_KEY = "aroko.authme";
const AUTH_ME_TTL = 5 * 60 * 1000;

function readAuthMeCache() {
  try {
    const raw = sessionStorage.getItem(AUTH_ME_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.t || Date.now() - parsed.t > AUTH_ME_TTL || !parsed.u) return null;
    return parsed;
  } catch { return null; }
}

function writeAuthMeCache(user) {
  try { sessionStorage.setItem(AUTH_ME_CACHE_KEY, JSON.stringify({ t: Date.now(), u: user })); }
  catch { /* almacenamiento lleno o no disponible */ }
}

function readLocalUser() {
  try { return JSON.parse(localStorage.getItem("usuario")) ?? null; }
  catch { return null; }
}

/** Detecta si el objeto guardado en localStorage está corrupto
 *  (nombre_usuario igual al correo o derivado de él) */
function isCorrupt(u) {
  if (!u) return false;
  const nombre = u.nombre_usuario || "";
  const correo = u.correo || u.email || "";
  if (!nombre || !correo) return false;
  // corrupto si el nombre ES el correo o es la parte antes del @
  return nombre === correo || nombre === correo.split("@")[0];
}

export function AuthProvider({ children }) {
  const [user,    setUserRaw] = useState(null);
  const [loading, setLoading] = useState(true);

  const setUser = useCallback((raw) => {
    const normalized = normalizeUser(raw);
    setUserRaw(normalized);
    if (normalized) {
      localStorage.setItem("usuario", JSON.stringify(normalized));
    } else {
      localStorage.removeItem("usuario");
    }
  }, []);

  const refreshFromServer = useCallback(async () => {
    if (!localStorage.getItem("token")) return false;
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.usuario ?? data);
      return true;
    } catch (err) {
      // 401 = token expirado o inválido — limpiar sesión silenciosamente
      if (err?.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
        setUserRaw(null);
      }
      return false;
    }
  }, [setUser]);

  useEffect(() => {
    const token   = localStorage.getItem("token");
    const local   = readLocalUser();
    const corrupt = isCorrupt(local);

    if (!token) {
      // Sin token: usar localStorage solo si no está corrupto
      if (local && !corrupt) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUserRaw(normalizeUser(local));
      } else {
        localStorage.removeItem("usuario");
        setUserRaw(null);
      }
      setLoading(false);
      return;
    }

    // Con token:
    // 1) Pintar YA con el usuario local (evita cascada /auth/me → render)
    const hasValidLocal = local && !corrupt;
    if (hasValidLocal) {
      setUserRaw(normalizeUser(local));
      setLoading(false);
    }

    // 2) Refrescar desde el servidor en idle (no compite con LCP del Hero),
    //    usando cache de sesión si es reciente.
    let cancelled = false;
    const refresh = () => {
      if (cancelled) return;

      const cached = readAuthMeCache();
      if (cached) {
        setUser(cached.u);
        return;
      }

      api.get("/auth/me")
        .then(({ data }) => {
          if (cancelled) return;
          const u = data.usuario ?? data;
          setUser(u);
          writeAuthMeCache(u);
        })
        .catch((err) => {
          if (cancelled) return;
          // Token inválido o expirado — limpiar sesión
          if (err?.response?.status === 401 || !hasValidLocal) {
            localStorage.removeItem("token");
            localStorage.removeItem("usuario");
            setUserRaw(null);
            try { sessionStorage.removeItem(AUTH_ME_CACHE_KEY); } catch { /* noop */ }
          }
        })
        .finally(() => {
          if (!cancelled && !hasValidLocal) setLoading(false);
        });
    };

    const handle = whenIdle(refresh, 2000);
    return () => { cancelled = true; cancelIdle(handle); };
  }, [setUser]);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    sessionStorage.removeItem(AUTH_ME_CACHE_KEY);
    setUserRaw(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, setUser, logout, refreshFromServer }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuthContext() {
  return useContext(AuthContext);
}
