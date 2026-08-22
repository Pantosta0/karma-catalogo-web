import { createFileRoute, Link, Outlet, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAppState } from "@/lib/app-store";
import { supabase } from "@/lib/supabase";
import { useCart, formatCOP } from "@/lib/cart";
import { getDiscountedPrice, calcCodeDiscount, type AppliedCode } from "@/lib/pricing";
import { getIsOpen, getNextOpeningTime } from "@/lib/schedule";
import { LoadingScreen } from "@/components/LoadingScreen";
import { SiteFooter } from "@/components/SiteFooter";
import { CategoryPill } from "@/components/menu/CategoryPill";
import { CartSheet } from "@/components/menu/CartSheet";
import { CheckoutModal } from "@/components/menu/CheckoutModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Settings, Clock } from "lucide-react";

export const Route = createFileRoute("/menu")({
  component: MenuLayout,
});

/**
 * Todo lo que tiene que sobrevivir a cambiar de categoría.
 *
 * El carrito, el código aplicado, la hoja del pedido y la barra de píldoras
 * viven aquí y no en las rutas hijas: al navegar de /menu/asados a
 * /menu/bebidas sólo se desmonta el hijo, así que el indicador deslizante
 * conserva su posición anterior y puede deslizarse hasta la nueva, y la hoja
 * del carrito no se cierra a mitad de un pedido.
 *
 * Las hijas no reciben el carrito por props ni por contexto: `useCart` lee de
 * un store de módulo, así que llamarlo de nuevo desde la ruta hija devuelve el
 * mismo carrito que ve esta barra.
 */
function MenuLayout() {
  const { state, loading } = useAppState();
  const cart = useCart(state.productos, !loading);
  const navigate = useNavigate();

  // El param de la hija. `strict: false` porque en /menu (la cuadrícula) no
  // hay ninguno — es justo cómo se distingue la cuadrícula de una categoría.
  const { categoria } = useParams({ strict: false }) as { categoria?: string };

  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);
  const [activePromo, setActivePromo] = useState<(typeof state.promos)[0] | null>(null);
  const [closedOpen, setClosedOpen] = useState(false);
  const [appliedCode, setAppliedCode] = useState<AppliedCode | null>(null);

  // El estado abierto/cerrado se reevalúa cada 30s y al volver a la pestaña.
  // Sin esto, quien deja el menú abierto sigue viendo "Abierto" pasada la hora
  // de cierre y alcanza a mandar un pedido que la cocina ya no recibe.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const id = window.setInterval(tick, 30_000);
    document.addEventListener("visibilitychange", tick);
    window.addEventListener("focus", tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
      window.removeEventListener("focus", tick);
    };
  }, []);

  const isOpen = useMemo(
    () => getIsOpen(state.config.schedule),
    // `now` es la señal de reloj: fuerza el recálculo cada tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.config.schedule, now],
  );

  const pillRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const barRef = useRef<HTMLDivElement>(null);
  const [slider, setSlider] = useState<{ left: number; width: number } | null>(null);

  // Mover el indicador deslizante al pill activo.
  //
  // Se vuelve a medir en tres momentos, no solo al cambiar de categoría:
  // al redimensionar o rotar (los pills cambian de sitio), cuando termina de
  // cargar Anton/Barlow desde Google Fonts (los anchos cambian bajo el
  // indicador ya dibujado) y cuando cambia la lista de categorías.
  useEffect(() => {
    if (!categoria) {
      // En la cuadrícula no hay barra; olvidar la medida para que al volver a
      // entrar el indicador no aparezca un frame en el sitio anterior.
      setSlider(null);
      return;
    }

    const measure = (scroll = false) => {
      const el = pillRefs.current.get(categoria);
      if (!el) return;
      setSlider({ left: el.offsetLeft, width: el.offsetWidth });
      if (scroll) el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    };

    measure(true);

    const bar = barRef.current;
    const ro = bar ? new ResizeObserver(() => measure()) : null;
    if (bar && ro) ro.observe(bar);

    let cancelled = false;
    document.fonts?.ready.then(() => { if (!cancelled) measure(); });

    return () => {
      cancelled = true;
      ro?.disconnect();
    };
  }, [categoria, state.categorias]);

  // Mostrar promo activa una vez por sesión
  useEffect(() => {
    if (loading) return;
    const today = new Date().toISOString().slice(0, 10);
    const promo = state.promos?.find(
      (p) => p.activo && today >= p.desde && today <= p.hasta
    ) ?? null;
    if (promo && !sessionStorage.getItem(`karma_promo_${promo.id}`)) {
      setActivePromo(promo);
      setPromoOpen(true);
    }
  }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Popup de cerrado — una vez por sesión, solo cuando el horario está
  // configurado. Depende de isOpen para que también aparezca si el negocio
  // cierra con el menú ya abierto, no solo al entrar.
  useEffect(() => {
    if (loading || isOpen !== false) return;
    if (sessionStorage.getItem("karma_closed_shown")) return;
    sessionStorage.setItem("karma_closed_shown", "1");
    setClosedOpen(true);
  }, [loading, isOpen]);

  // Subtotal ajustado con descuentos por producto
  const productDiscountTotal = cart.items.reduce(
    (acc, i) => acc + (i.product.precio - getDiscountedPrice(i.product)) * i.cantidad,
    0,
  );
  const discountedSubtotal = cart.subtotal - productDiscountTotal;
  const codeDiscountAmount = appliedCode ? calcCodeDiscount(appliedCode, discountedSubtotal) : 0;
  // Domicilio se suma DESPUÉS de descuentos, no es afectado por códigos
  const deliveryFee = state.config.deliveryFee ?? 5000;
  const totalFinal = discountedSubtotal - codeDiscountAmount + deliveryFee;

  const logoUrl = state.config.logoSquare;
  const logoHeaderUrl = state.config.logoRect || state.config.logoSquare;

  if (loading) return <LoadingScreen logoUrl={logoUrl} />;

  return (
    <div className="min-h-screen [padding-bottom:calc(8rem+env(safe-area-inset-bottom))]">
      {/* Saltar la barra de categorías, que en teclado son N tabuladas antes
          de llegar a un solo producto. */}
      <a
        href="#menu"
        className="focus-ring sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-foreground"
      >
        Saltar al menú
      </a>

      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-background/85 border-b border-border/60">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          {/* El logo lleva a la portada de marca, no al menú: desde /menu ya
              se está en el menú, y es el único camino de vuelta a "/". */}
          <Link to="/" aria-label={`${state.config.nombre} — inicio`} className="focus-ring rounded shrink-0">
            {logoHeaderUrl ? (
              // El logo lo sube el dueño y su proporción es desconocida, así que
              // width/height afirmarían una relación que puede ser falsa. En su
              // lugar se reserva el hueco: alto fijo y un ancho mínimo, para que
              // la insignia de abierto/cerrado no salte cuando la imagen decodifica.
              <span className="flex h-12 sm:h-14 min-w-12 sm:min-w-14 items-center shrink-0">
                <img
                  src={logoHeaderUrl}
                  alt={state.config.nombre}
                  fetchPriority="high"
                  decoding="async"
                  className="h-full w-auto max-w-40 object-contain object-left"
                />
              </span>
            ) : (
              // Sin logo cargado: el nombre hace de marca. Un src vacío haría
              // que el navegador volviera a pedir la página entera.
              <span className="font-display text-xl sm:text-2xl text-brand-bright leading-none">
                {state.config.nombre}
              </span>
            )}
          </Link>
          {isOpen !== null && (
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
              isOpen
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-red-500/20 text-red-400 border border-red-500/30"
            }`}>
              {isOpen ? "Abierto" : "Cerrado"}
            </span>
          )}
          <div className="flex-1" />
          <Link
            to="/admin"
            aria-label="Panel de administración"
            className="focus-ring h-11 w-11 rounded-full flex items-center justify-center text-muted-foreground hover:text-brand-bright hover:bg-muted transition"
          >
            <Settings className="h-5 w-5" />
          </Link>
          <Sheet open={cartOpen} onOpenChange={setCartOpen}>
            <SheetTrigger asChild>
              <button
                className="focus-ring relative inline-flex items-center justify-center h-11 w-11 rounded-full bg-primary text-primary-foreground shadow-card hover:scale-105 transition"
                aria-label="Carrito"
              >
                <ShoppingCart className="h-5 w-5" />
                {cart.count > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-secondary text-secondary-foreground text-[11px] font-bold flex items-center justify-center">
                    {cart.count}
                  </span>
                )}
              </button>
            </SheetTrigger>
            <CartSheet
              items={cart.items}
              subtotal={cart.subtotal}
              productDiscountTotal={productDiscountTotal}
              appliedCode={appliedCode}
              codeDiscountAmount={codeDiscountAmount}
              deliveryFee={deliveryFee}
              totalFinal={totalFinal}
              onApplyCode={setAppliedCode}
              setQty={cart.setQty}
              remove={cart.remove}
              onCheckout={() => {
                setCartOpen(false);
                setCheckoutOpen(true);
              }}
            />
          </Sheet>
        </div>

        {/* Barra de categorías — sólo dentro de una categoría. En la cuadrícula
            sería una segunda copia del mismo menú. */}
        {categoria && (
          <div className="max-w-5xl mx-auto px-4 pb-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div ref={barRef} className="relative flex gap-2 min-w-max">
              {/*
                Indicador deslizante. El desplazamiento —el movimiento que se ve—
                va por `transform`, que corre en el compositor. El ancho sigue
                siendo `width` a propósito: la alternativa (`scaleX`) deforma los
                extremos de una píldora completamente redondeada y los deja como
                elipses durante toda la transición. Es un único nodo hoja,
                absoluto y sin hijos, así que el relayout no toca el documento.
              */}
              {slider && (
                <div
                  aria-hidden="true"
                  className="slider-indicator absolute top-0 bottom-0 left-0 rounded-full bg-primary shadow-soft pointer-events-none"
                  style={{
                    transform: `translate3d(${slider.left}px, 0, 0)`,
                    width: slider.width,
                  }}
                />
              )}
              <CategoryPill
                active={categoria === "todos"}
                ref={(el) => { if (el) pillRefs.current.set("todos", el); else pillRefs.current.delete("todos"); }}
                onClick={() => navigate({ to: "/menu/$categoria", params: { categoria: "todos" } })}
              >
                Todos
              </CategoryPill>
              {state.categorias.map((c) => (
                <CategoryPill
                  key={c.id}
                  active={categoria === c.id}
                  ref={(el) => { if (el) pillRefs.current.set(c.id, el); else pillRefs.current.delete(c.id); }}
                  onClick={() => navigate({ to: "/menu/$categoria", params: { categoria: c.id } })}
                >
                  {c.nombre}
                </CategoryPill>
              ))}
            </div>
          </div>
        )}
      </header>

      <Outlet />

      {/* Floating cart button (mobile) */}
      {cart.count > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          // bottom con safe-area: en iPhone con indicador de inicio, un
          // bottom-4 seco deja la barra dentro de la zona del gesto.
          style={{ bottom: "max(1rem, calc(env(safe-area-inset-bottom) + 0.5rem))" }}
          className="focus-ring fixed left-4 right-4 mx-auto max-w-md z-20 bg-gradient-brand text-brand-foreground rounded-full px-5 py-4 shadow-card flex items-center justify-between font-semibold"
        >
          <span className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" /> {cart.count} {cart.count === 1 ? "ítem" : "ítems"}
          </span>
          <span>{formatCOP(totalFinal)}</span>
        </button>
      )}

      {/* Promo popup */}
      {activePromo && (
        <Dialog open={promoOpen} onOpenChange={(o) => {
          if (!o) {
            sessionStorage.setItem(`karma_promo_${activePromo.id}`, "1");
            setPromoOpen(false);
          }
        }}>
          <DialogContent className="max-w-sm p-0 overflow-hidden gap-0">
            {activePromo.imagen && (
              <div className="aspect-video w-full bg-muted">
                <img
                  src={activePromo.imagen}
                  alt=""
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-5">
              <DialogHeader>
                <DialogTitle className="font-display text-xl">{activePromo.titulo}</DialogTitle>
                {activePromo.descripcion && (
                  <DialogDescription className="text-muted-foreground whitespace-pre-line">
                    {activePromo.descripcion}
                  </DialogDescription>
                )}
              </DialogHeader>
              <Button
                onClick={() => {
                  sessionStorage.setItem(`karma_promo_${activePromo.id}`, "1");
                  setPromoOpen(false);
                }}
                className="w-full mt-4 bg-gradient-brand text-brand-foreground"
              >
                ¡Entendido!
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Popup de restaurante cerrado */}
      <Dialog open={closedOpen} onOpenChange={setClosedOpen}>
        <DialogContent className="max-w-sm text-center">
          <div className="flex flex-col items-center gap-4 pt-2 pb-1">
            <div className="h-14 w-14 rounded-full bg-red-500/15 border border-red-500/25 flex items-center justify-center">
              <Clock className="h-6 w-6 text-red-400" />
            </div>
            <DialogHeader className="items-center gap-1">
              <DialogTitle className="font-display text-xl">Estamos cerrados</DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm">
                {(() => {
                  const next = getNextOpeningTime(state.config.schedule);
                  return next
                    ? `Por ahora no estamos tomando pedidos. Abrimos ${next}.`
                    : "Por ahora no estamos tomando pedidos. Vuelve pronto.";
                })()}
              </DialogDescription>
            </DialogHeader>
            <Button
              onClick={() => setClosedOpen(false)}
              className="w-full bg-gradient-brand text-brand-foreground"
            >
              Entendido
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Checkout modal */}
      <CheckoutModal
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        items={cart.items}
        subtotal={cart.subtotal}
        productDiscountTotal={productDiscountTotal}
        appliedCode={appliedCode}
        codeDiscountAmount={codeDiscountAmount}
        deliveryFee={deliveryFee}
        totalFinal={totalFinal}
        whatsapp={state.config.whatsapp}
        onSent={() => {
          // Incrementar usos del código si fue aplicado.
          //
          // Vía RPC y no con update(): update() dispara un guardado completo
          // del estado —config, productos, categorías— desde el catálogo
          // público, que con RLS activo ya no está permitido. La función
          // toca una sola columna y el incremento es atómico, así que dos
          // pedidos simultáneos ya no se pisan el contador.
          if (appliedCode) {
            const id = appliedCode.id;
            supabase
              .rpc("increment_code_usage", { code_id: id })
              .then(({ error }) => {
                if (error) console.warn("[promo] no se pudo contar el uso:", error.message);
              });
            setAppliedCode(null);
          }
          cart.clear();
          setCheckoutOpen(false);
        }}
      />

      <SiteFooter />
    </div>
  );
}
