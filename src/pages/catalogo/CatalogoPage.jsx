import { useState } from "react";
import Navbar         from "../../components/landing/Navbar";
import Catalogo       from "../../components/landing/Catalogo";
import CartDrawer     from "../../components/landing/CartDrawer";
import CheckoutModal  from "../../components/landing/CheckoutModal";
import Footer         from "../../components/landing/Footer";
import { useCart }    from "../../context/CartContext";
import "../landing/landing.css";

export default function CatalogoPage() {
  const { items, add, remove, updateQty, total, count, clear } = useCart();
  const [cartOpen,     setCartOpen]     = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  return (
    <div className="landingRoot">
      <Navbar cartCount={count} onCartClick={() => setCartOpen(true)} lightBg />
      <Catalogo onAddToCart={add} />
      <Footer />
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={items}
        onRemove={remove}
        onUpdateQty={updateQty}
        total={total}
        onCheckout={() => setCheckoutOpen(true)}
      />
      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        items={items}
        total={total}
        onSuccess={clear}
      />
    </div>
  );
}
