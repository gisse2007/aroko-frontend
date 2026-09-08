import { createContext, useContext, useState, useEffect } from "react";
import { normalizeProduct } from "../utils/image";

const CartContext = createContext(null);

function storageKey(userId) {
  return userId ? `aroko_cart_${userId}` : null;
}

function readStorage(userId) {
  const key = storageKey(userId);
  if (!key) return [];
  try { return JSON.parse(sessionStorage.getItem(key)) ?? []; }
  catch { return []; }
}

function toCartItem(product) {
  const norm  = normalizeProduct(product);
  const id    = norm.id_producto ?? norm.id;
  const name  = norm.nombre ?? norm.name ?? "";
  const price = Number(norm.precio ?? norm.price ?? 0);
  return {
    ...norm,
    id,
    name,
    price,
    priceLabel: `$${price.toLocaleString("es-CO")}`,
  };
}

export function CartProvider({ userId = null, children }) {
  const [items, setItems] = useState(() => readStorage(userId));

  // Cuando cambia el usuario: cargar su carrito o vaciar si no hay sesión
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(readStorage(userId));
    // Limpiar claves huérfanas de otros usuarios
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith("aroko_cart_") && k !== storageKey(userId)) {
        sessionStorage.removeItem(k);
      }
    }
  }, [userId]);

  const persist = (updater) => {
    setItems((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      const key = storageKey(userId);
      if (key) sessionStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  };

  const add = (product) => {
    const prod = toCartItem(product);
    persist((prev) => {
      const found = prev.find((i) => i.id === prod.id);
      if (found) return prev.map((i) => i.id === prod.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...prod, qty: 1 }];
    });
  };

  const remove = (id) => persist((prev) => prev.filter((i) => i.id !== id));

  const updateQty = (id, qty) => {
    if (qty < 1) return remove(id);
    persist((prev) => prev.map((i) => i.id === id ? { ...i, qty } : i));
  };

  const clear = () => {
    setItems([]);
    const key = storageKey(userId);
    if (key) sessionStorage.removeItem(key);
  };

  const total = items.reduce((acc, i) => acc + (Number(i.price) || 0) * i.qty, 0);
  const count = items.reduce((acc, i) => acc + i.qty, 0);

  return (
    <CartContext.Provider value={{ items, add, remove, updateQty, clear, total, count }}>
      {children}
    </CartContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  return useContext(CartContext);
}
