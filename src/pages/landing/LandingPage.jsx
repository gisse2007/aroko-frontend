import { lazy, Suspense, useCallback, useState } from "react";
import Navbar        from "../../components/landing/Navbar";
import Hero          from "../../components/landing/Hero";
import Categories    from "../../components/landing/Categories";
import Novedades     from "../../components/landing/Novedades";
import Testimonios   from "../../components/landing/Testimonios";
import Footer        from "../../components/landing/Footer";
import { useCart }   from "../../context/CartContext";
import "./landing.css";

// ── Componentes pesados: code-splitting con React.lazy ──────────────────────
// CartDrawer y CheckoutModal (y framer-motion que arrastran) NO viajan en el
// bundle inicial: se descargan bajo demanda la primera vez que se abren.
const CartDrawer    = lazy(() => import("../../components/landing/CartDrawer"));
const CheckoutModal = lazy(() => import("../../components/landing/CheckoutModal"));

export default function LandingPage() {
  const { items, add, remove, updateQty, total, count, clear } = useCart();
  const [cartOpen,         setCartOpen]         = useState(false);
  const [checkoutOpen,     setCheckoutOpen]     = useState(false);
  // "Mounted" evita descargar el chunk hasta el primer uso; después permanece
  // montado para conservar las animaciones de salida.
  const [cartMounted,      setCartMounted]      = useState(false);
  const [checkoutMounted,  setCheckoutMounted]  = useState(false);

  const handleCartClick = useCallback(() => {
    setCartMounted(true);
    setCartOpen(true);
  }, []);

  const handleCheckout = useCallback(() => {
    setCartOpen(false);
    setCheckoutMounted(true);
    setCheckoutOpen(true);
  }, []);

  return (
    <div className="landingRoot">
      <Navbar cartCount={count} onCartClick={handleCartClick} />
      <Hero />
      <Categories />
      <Novedades onAddToCart={add} />
      <Testimonios />
      <Footer />

      {cartMounted && (
        <Suspense fallback={null}>
          <CartDrawer
            open={cartOpen}
            onClose={() => setCartOpen(false)}
            items={items}
            onRemove={remove}
            onUpdateQty={updateQty}
            total={total}
            onCheckout={handleCheckout}
          />
        </Suspense>
      )}

      {checkoutMounted && (
        <Suspense fallback={null}>
          <CheckoutModal
            open={checkoutOpen}
            onClose={() => setCheckoutOpen(false)}
            items={items}
            total={total}
            onSuccess={clear}
          />
        </Suspense>
      )}
    </div>
  );
}