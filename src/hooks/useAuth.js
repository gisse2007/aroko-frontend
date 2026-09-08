import { useState, useCallback } from "react";
import api from "../api/axios";

export function useAuth() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("usuario")); } catch { return null; }
  });

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    setUser(null);
  }, []);

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return; // sin token no llamar /auth/me
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.usuario ?? data);
    } catch {
      logout();
    }
  }, [logout]);

  return { user, setUser, logout, fetchMe };
}
