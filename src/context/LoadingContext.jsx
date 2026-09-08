import { createContext, useContext, useState, useCallback, useMemo, useRef } from "react";

const LoadingContext = createContext(null);

/**
 * LoadingProvider
 *   - showOverlay / hideOverlay  → overlay global para operaciones importantes
 *   - incrementHttp/decrementHttp → conteo de peticiones en vuelo (usado por axios)
 *   - isFetching                  → true mientras haya peticiones activas
 */
export function LoadingProvider({ children }) {
  const [overlay,   setOverlay]  = useState({ visible: false, text: "Procesando..." });
  const [httpCount, setHttpCount] = useState(0);
  const counterRef                = useRef(0);

  const showOverlay = useCallback((text = "Procesando...") => {
    setOverlay({ visible: true, text });
  }, []);

  const hideOverlay = useCallback(() => {
    setOverlay({ visible: false, text: "Procesando..." });
  }, []);

  const incrementHttp = useCallback(() => {
    counterRef.current += 1;
    setHttpCount(counterRef.current);
  }, []);

  const decrementHttp = useCallback(() => {
    counterRef.current = Math.max(0, counterRef.current - 1);
    setHttpCount(counterRef.current);
  }, []);

  const isFetching = httpCount > 0;

  // Valor memoizado: evita re-renderizar a todos los consumidores cuando solo
  // cambia el contador interno sin alterar isFetching (peticiones paralelas).
  const value = useMemo(() => ({
    overlay, showOverlay, hideOverlay,
    isFetching, incrementHttp, decrementHttp,
  }), [overlay, isFetching, showOverlay, hideOverlay, incrementHttp, decrementHttp]);

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLoading() {
  const ctx = useContext(LoadingContext);
  if (!ctx) throw new Error("useLoading debe usarse dentro de LoadingProvider");
  return ctx;
}
