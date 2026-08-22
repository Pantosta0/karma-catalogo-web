import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useRef, forwardRef } from "react";
import { useAppState } from "@/lib/app-store";
import { supabase } from "@/lib/supabase";
import { useCart, formatCOP } from "@/lib/cart";
import {
  getDiscountedPrice,
  isDiscounted,
  validateCode,
  calcCodeDiscount,
  type AppliedCode,
} from "@/lib/pricing";
import type { Product, DaySchedule } from "@/lib/storage";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ShoppingCart, Plus, Minus, Trash2, ImageOff, Send, Settings, X, Clock } from "lucide-react";
import { LoadingScreen } from "@/components/LoadingScreen";

// Calcula si el negocio está abierto ahora según el horario (zona horaria Bogotá)
function getIsOpen(schedule: DaySchedule[] | undefined): boolean | null {
  if (!schedule || schedule.length !== 7) return null;
  // Forzar hora de Bogotá (UTC-5) independientemente del dispositivo del cliente
  const bogota = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Bogota" }));
  const ds = schedule[bogota.getDay()]; // 0=Dom
  if (!ds) return null;
  if (!ds.open) return false;
  const [fh, fm] = ds.from.split(":").map(Number);
  const [th, tm] = ds.to.split(":").map(Number);
  const mins = bogota.getHours() * 60 + bogota.getMinutes();
  return mins >= fh * 60 + fm && mins <= th * 60 + tm;
}

// Devuelve cuándo abre el negocio la próxima vez (texto legible)
function getNextOpeningTime(schedule: DaySchedule[]): string | null {
  if (!schedule || schedule.length !== 7) return null;
  const bogota = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Bogota" }));
  const todayDay = bogota.getDay();
  const todayMins = bogota.getHours() * 60 + bogota.getMinutes();
  const dayNames = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

  // Quizás hoy aún abra más tarde
  const todayDs = schedule[todayDay];
  if (todayDs?.open) {
    const [fh, fm] = todayDs.from.split(":").map(Number);
    if (todayMins < fh * 60 + fm) return `hoy a las ${todayDs.from}`;
  }

  // Siguiente día con horario abierto
  for (let i = 1; i <= 7; i++) {
    const dayIdx = (todayDay + i) % 7;
    const ds = schedule[dayIdx];
    if (ds?.open) {
      const label = i === 1 ? "mañana" : `el ${dayNames[dayIdx]}`;
      return `${label} a las ${ds.from}`;
    }
  }
  return null;
}

// El título del catálogo lo define __root a partir del nombre configurado en
// el panel; las etiquetas para crawlers viven en index.html.
export const Route = createFileRoute("/")({
  component: CatalogPage,
});

function CatalogPage() {
  // El catálogo es sólo lectura: ya no escribe estado global.
  const { state, loading } = useAppState();
  const cart = useCart(state.productos, !loading);
  const [activeCat, setActiveCat] = useState<string>("todos");
  const [selected, setSelected] = useState<Product | null>(null);
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
    const measure = (scroll = false) => {
      const el = pillRefs.current.get(activeCat);
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
  }, [activeCat, state.categorias]);

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

  // ⚠️ Todos los hooks deben ir ANTES de cualquier return condicional
  const visibles = useMemo(
    () => state.productos.filter((p) => p.disponible && (activeCat === "todos" || p.categorias.includes(activeCat))),
    [state.productos, activeCat],
  );

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

        {/* Category bar */}
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
              active={activeCat === "todos"}
              ref={(el) => { if (el) pillRefs.current.set("todos", el); else pillRefs.current.delete("todos"); }}
              onClick={() => setActiveCat("todos")}
            >
              Todos
            </CategoryPill>
            {state.categorias.map((c) => (
              <CategoryPill
                key={c.id}
                active={activeCat === c.id}
                ref={(el) => { if (el) pillRefs.current.set(c.id, el); else pillRefs.current.delete(c.id); }}
                onClick={() => setActiveCat(c.id)}
              >
                {c.nombre}
              </CategoryPill>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4">
        {/* Hero strip */}
        <section className="pt-6 pb-4">
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-brand-bright text-balance">
            Sabes lo que hiciste. Te lo mereces hoy.
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Elige tu pedido y envíalo directo por WhatsApp.
          </p>
        </section>

        {/* Product grid - 3 col instagram-like */}
        <section id="menu" aria-labelledby="menu-heading" className="scroll-mt-32">
          {/* El grid pasaba de h1 a h3 sin nivel intermedio. Este h2 cierra el
              salto y nombra la región para lectores de pantalla. */}
          <h2 id="menu-heading" className="sr-only">
            {activeCat === "todos"
              ? "Todos los productos"
              : state.categorias.find((c) => c.id === activeCat)?.nombre ?? "Productos"}
          </h2>
          {visibles.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">
                {activeCat === "todos"
                  ? "El menú está vacío por ahora. Vuelve en un rato."
                  : "Nada disponible en esta categoría ahora mismo."}
              </p>
              {activeCat !== "todos" && (
                <button
                  onClick={() => setActiveCat("todos")}
                  className="focus-ring mt-3 text-sm font-semibold text-brand-bright hover:underline underline-offset-4"
                >
                  Ver todo el menú
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {visibles.map((p) => (
                <ProductCard key={p.id} product={p} onOpen={() => setSelected(p)} onAdd={() => cart.add(p, 1)} />
              ))}
            </div>
          )}
        </section>
      </main>

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

      {/* Product detail modal */}
      <ProductModal
        product={selected}
        onClose={() => setSelected(null)}
        onAdd={(qty) => {
          if (selected) cart.add(selected, qty);
          setSelected(null);
        }}
      />

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

      {/* Un solo footer: antes eran dos hermanos, y dos landmarks
          contentinfo compiten en la navegación por lector de pantalla. */}
      <footer className="mt-16 border-t border-border/40 pt-8 pb-8 max-w-5xl mx-auto px-4 flex flex-col items-center gap-2">
        <Link
          to="/politica-de-privacidad-y-uso-de-datos"
          className="focus-ring rounded text-sm text-muted-foreground hover:text-brand-bright transition-colors"
        >
          Política de Privacidad y Uso de Datos
        </Link>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} {state.config.nombre}
        </p>
      </footer>
    </div>
  );
}

const CategoryPill = forwardRef<
  HTMLButtonElement,
  { active: boolean; onClick: () => void; children: React.ReactNode }
>(({ active, onClick, children }, ref) => (
  <button
    ref={ref}
    onClick={onClick}
    className={`focus-ring relative z-10 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors duration-200 ${
      active
        ? "text-primary-foreground"
        : "text-muted-foreground hover:text-foreground"
    }`}
  >
    {children}
  </button>
));

function ProductCard({
  product,
  onOpen,
  onAdd,
}: {
  product: Product;
  onOpen: () => void;
  onAdd: () => void;
}) {
  return (
    <div className="group relative bg-card rounded-2xl overflow-hidden shadow-card border border-border/60 hover:-translate-y-0.5 transition">
      {/* inset: la tarjeta recorta con overflow-hidden y un anillo hacia
          afuera se perdería entero. aria-label porque cuando el producto no
          tiene foto el contenido es un icono decorativo y el botón se
          anunciaría sólo como "button". */}
      <button
        onClick={onOpen}
        aria-label={`Ver ${product.nombre}`}
        className="focus-ring-inset block w-full aspect-square bg-muted overflow-hidden"
      >
        {product.foto ? (
          <img
            src={product.foto}
            alt=""
            loading="lazy"
            decoding="async"
            width={600}
            height={600}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <ImageOff className="h-8 w-8" />
          </div>
        )}
      </button>
      <div className="p-3 pb-12">
        <h3 className="font-semibold text-sm sm:text-base leading-tight line-clamp-2">{product.nombre}</h3>
        {isDiscounted(product) ? (
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <p className="text-brand-bright font-display font-bold">{formatCOP(getDiscountedPrice(product))}</p>
            <p className="text-muted-foreground text-xs line-through">{formatCOP(product.precio)}</p>
            {/* Relleno sólido, no un lavado al 15%: sobre el wash el rojo se
                quedaba en 4.24:1. Blanco sobre el relleno da 4.56:1. */}
            <span className="text-[11px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
              -{product.descuento_pct}%
            </span>
          </div>
        ) : (
          <p className="text-brand-bright font-display font-bold mt-1">{formatCOP(product.precio)}</p>
        )}
      </div>
      <button
        onClick={onAdd}
        aria-label={`Agregar ${product.nombre}`}
        className="focus-ring absolute bottom-3 right-3 h-11 w-11 rounded-full bg-secondary text-secondary-foreground shadow-card flex items-center justify-center hover:scale-110 transition"
      >
        <Plus className="h-5 w-5" />
      </button>
    </div>
  );
}

function ProductModal({
  product,
  onClose,
  onAdd,
}: {
  product: Product | null;
  onClose: () => void;
  onAdd: (qty: number) => void;
}) {
  const [qty, setQty] = useState(1);
  return (
    <Dialog
      open={!!product}
      onOpenChange={(o) => {
        if (!o) {
          onClose();
          setQty(1);
        }
      }}
    >
      {/* Cuando el plato no tiene descripción no se renderiza DialogDescription.
          Radix avisa por consola salvo que la clave aria-describedby exista con
          valor undefined, así que hay que pasarla por spread, no por ternario:
          `aria-describedby={undefined}` y omitir la prop son lo mismo en JSX. */}
      <DialogContent
        className="max-w-md p-0 overflow-hidden"
        {...(product?.descripcion ? {} : { "aria-describedby": undefined })}
      >
        {product && (
          <>
            <div className="aspect-square bg-muted">
              {product.foto ? (
                <img
                  src={product.foto}
                  alt={product.nombre}
                  decoding="async"
                  width={600}
                  height={600}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <ImageOff className="h-10 w-10" />
                </div>
              )}
            </div>
            <div className="p-5">
              <DialogHeader>
                <DialogTitle className="font-display text-xl">{product.nombre}</DialogTitle>
                {/* Sin descripción no se inventa una: el relleno genérico
                    ("Delicioso producto") resta más de lo que aporta. */}
                {product.descripcion && (
                  <DialogDescription className="text-muted-foreground">
                    {product.descripcion}
                  </DialogDescription>
                )}
              </DialogHeader>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <span className="tabular text-2xl font-display font-bold text-brand-bright">
                    {formatCOP(getDiscountedPrice(product) * qty)}
                  </span>
                  {isDiscounted(product) && (
                    <p className="text-xs text-muted-foreground line-through">
                      {formatCOP(product.precio * qty)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 bg-muted rounded-full p-1">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="focus-ring h-11 w-11 rounded-full bg-card flex items-center justify-center"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-6 text-center font-semibold">{qty}</span>
                  <button
                    onClick={() => setQty(qty + 1)}
                    className="focus-ring h-11 w-11 rounded-full bg-card flex items-center justify-center"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <Button
                onClick={() => {
                  onAdd(qty);
                  setQty(1);
                }}
                className="w-full mt-5 bg-gradient-brand text-brand-foreground hover:opacity-95"
                size="lg"
              >
                Agregar al carrito
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CartSheet({
  items, subtotal, productDiscountTotal, appliedCode, codeDiscountAmount, deliveryFee, totalFinal,
  onApplyCode, setQty, remove, onCheckout,
}: {
  items: ReturnType<typeof useCart>["items"];
  subtotal: number;
  productDiscountTotal: number;
  appliedCode: AppliedCode | null;
  codeDiscountAmount: number;
  deliveryFee: number;
  totalFinal: number;
  onApplyCode: (c: AppliedCode | null) => void;
  setQty: (id: string, q: number) => void;
  remove: (id: string) => void;
  onCheckout: () => void;
}) {
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState("");

  const [validando, setValidando] = useState(false);

  const applyCode = async () => {
    if (!codeInput.trim() || validando) return;
    setValidando(true);
    const result = await validateCode(codeInput);
    if (result.ok) {
      onApplyCode(result.code);
      setCodeError("");
      setCodeInput("");
    } else {
      setCodeError(result.error);
    }
    setValidando(false);
  };

  return (
    <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
      <SheetHeader>
        <SheetTitle className="font-display">Tu pedido</SheetTitle>
      </SheetHeader>
      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {items.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground">Todavía no has agregado nada.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Toca el + en cualquier plato del menú.
            </p>
          </div>
        ) : (
          items.map((i) => {
            const discounted = isDiscounted(i.product);
            return (
              <div key={i.product.id} className="flex gap-3 bg-muted/50 rounded-xl p-2">
                <div className="h-16 w-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {i.product.foto ? (
                    <img
                      src={i.product.foto}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm line-clamp-1">{i.product.nombre}</p>
                  <div className="flex items-center gap-1.5">
                    <p className="tabular text-brand-bright font-bold text-sm">{formatCOP(getDiscountedPrice(i.product) * i.cantidad)}</p>
                    {discounted && <p className="text-muted-foreground text-xs line-through">{formatCOP(i.product.precio * i.cantidad)}</p>}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <button onClick={() => setQty(i.product.id, i.cantidad - 1)}
                      className="focus-ring h-11 w-11 rounded-full bg-card border border-border flex items-center justify-center">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-sm font-semibold w-5 text-center">{i.cantidad}</span>
                    <button onClick={() => setQty(i.product.id, i.cantidad + 1)}
                      className="focus-ring h-11 w-11 rounded-full bg-card border border-border flex items-center justify-center">
                      <Plus className="h-3 w-3" />
                    </button>
                    <button onClick={() => remove(i.product.id)}
                      className="focus-ring ml-auto h-11 w-11 -mr-1 rounded-full flex items-center justify-center text-brand-bright" aria-label="Eliminar">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      {items.length > 0 && (
        <div className="border-t border-border pt-4 space-y-3">
          {/* Código promo */}
          <div>
            {appliedCode ? (
              <div className="flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2">
                <div>
                  <p className="text-xs font-bold text-green-400">Código: {appliedCode.code}</p>
                  <p className="text-xs text-muted-foreground">
                    -{appliedCode.descuento_tipo === "porcentaje" ? `${appliedCode.descuento_valor}%` : formatCOP(appliedCode.descuento_valor)} del subtotal
                  </p>
                </div>
                <button
                  onClick={() => onApplyCode(null)}
                  aria-label="Quitar código"
                  className="focus-ring h-11 w-11 -mr-2 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input placeholder="Código promo" value={codeInput}
                  onChange={(e) => { setCodeInput(e.target.value.toUpperCase()); setCodeError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && applyCode()}
                  className="font-display tracking-widest uppercase text-sm" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={applyCode}
                  disabled={validando}
                  className="shrink-0"
                >
                  {validando ? "…" : "Aplicar"}
                </Button>
              </div>
            )}
            {codeError && (
              <p role="alert" className="text-xs text-brand-bright mt-1">
                {codeError}
              </p>
            )}
            <p aria-live="polite" className="sr-only">
              {appliedCode
                ? `Código ${appliedCode.code} aplicado. Descuento de ${formatCOP(codeDiscountAmount)}. Nuevo total ${formatCOP(totalFinal)}.`
                : ""}
            </p>
          </div>

          {/* Desglose */}
          <div className="tabular space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span><span>{formatCOP(subtotal)}</span>
            </div>
            {productDiscountTotal > 0 && (
              <div className="flex justify-between text-green-400">
                <span>Descuentos productos</span><span>-{formatCOP(productDiscountTotal)}</span>
              </div>
            )}
            {appliedCode && codeDiscountAmount > 0 && (
              <div className="flex justify-between text-green-400">
                <span>Código {appliedCode.code}</span><span>-{formatCOP(codeDiscountAmount)}</span>
              </div>
            )}
            {deliveryFee > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Domicilio</span><span>{formatCOP(deliveryFee)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-1 border-t border-border">
              <span>Total</span>
              <span className="tabular text-brand-bright font-display">{formatCOP(totalFinal)}</span>
            </div>
          </div>

          <Button onClick={onCheckout} size="lg" className="w-full bg-gradient-brand text-brand-foreground hover:opacity-95">
            <Send className="h-4 w-4 mr-2" />Enviar pedido por WhatsApp
          </Button>
        </div>
      )}
    </SheetContent>
  );
}

function CheckoutModal({
  open, onOpenChange, items, subtotal, productDiscountTotal,
  appliedCode, codeDiscountAmount, deliveryFee, totalFinal, whatsapp, onSent,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  items: ReturnType<typeof useCart>["items"];
  subtotal: number;
  productDiscountTotal: number;
  appliedCode: AppliedCode | null;
  codeDiscountAmount: number;
  deliveryFee: number;
  totalFinal: number;
  whatsapp: string;
  onSent: () => void;
}) {
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [pago, setPago] = useState("Efectivo");
  const [errors, setErrors] = useState<{ nombre?: string; direccion?: string; telefono?: string }>({});
  const [enviando, setEnviando] = useState(false);

  // Un número colombiano son 10 dígitos; se aceptan 7 (fijo) a 15 (E.164).
  const validate = () => {
    const next: typeof errors = {};
    if (!nombre.trim()) next.nombre = "Necesitamos tu nombre para el pedido.";
    if (!direccion.trim()) next.direccion = "Sin dirección no podemos llevarlo.";
    const digits = telefono.replace(/\D/g, "");
    if (!digits) next.telefono = "Necesitamos un número para confirmarte.";
    else if (digits.length < 7 || digits.length > 15) next.telefono = "Ese número no parece completo.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const enviar = () => {
    if (enviando) return; // evita doble envío si tocan dos veces
    if (!validate()) return;

    const destino = whatsapp.replace(/\D/g, "");
    if (!destino) {
      setErrors({
        telefono: "El restaurante aún no configuró su WhatsApp. Escríbenos por Instagram.",
      });
      return;
    }
    setEnviando(true);

    const detalle = items
      .map((i) => {
        const dp = getDiscountedPrice(i.product);
        const disc = isDiscounted(i.product) ? ` (antes ${formatCOP(i.product.precio)})` : "";
        return `   - ${i.cantidad}x ${i.product.nombre} — ${formatCOP(dp * i.cantidad)}${disc}`;
      })
      .join("\n");
    const discLines = [
      productDiscountTotal > 0 ? `\n- Descuento productos: -${formatCOP(productDiscountTotal)}` : "",
      appliedCode ? `\n- Código ${appliedCode.code}: -${formatCOP(codeDiscountAmount)}` : "",
      deliveryFee > 0 ? `\n- Domicilio: ${formatCOP(deliveryFee)}` : "",
    ].join("");
    const msg = `Hola! quisiera hacer un pedido:

- Nombre completo: ${nombre}

- Pedido detallado:
${detalle}

- Dirección + punto de referencia: ${direccion}

- Número de contacto: ${telefono}

- Medio de pago: ${pago}
${discLines}
Total: ${formatCOP(totalFinal)}`;
    const url = `https://wa.me/${destino}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    onSent();
    setNombre("");
    setDireccion("");
    setTelefono("");
    setPago("Efectivo");
    setErrors({});
    setEnviando(false);
  };

  const opciones = ["Efectivo", "Nequi", "Bancolombia", "Otro"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Datos de entrega</DialogTitle>
          <DialogDescription>Completa para enviar tu pedido por WhatsApp.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <div>
            <Label htmlFor="nombre">Nombre completo</Label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => { setNombre(e.target.value); setErrors((p) => ({ ...p, nombre: undefined })); }}
              maxLength={80}
              autoComplete="name"
              aria-invalid={!!errors.nombre}
              aria-describedby={errors.nombre ? "nombre-error" : undefined}
            />
            {errors.nombre && (
              <p id="nombre-error" className="text-xs text-brand-bright mt-1">{errors.nombre}</p>
            )}
          </div>
          <div>
            <Label htmlFor="dir">Dirección + punto de referencia</Label>
            <Textarea
              id="dir"
              value={direccion}
              onChange={(e) => { setDireccion(e.target.value); setErrors((p) => ({ ...p, direccion: undefined })); }}
              maxLength={240}
              rows={2}
              autoComplete="street-address"
              aria-invalid={!!errors.direccion}
              aria-describedby={errors.direccion ? "dir-error" : undefined}
            />
            {errors.direccion && (
              <p id="dir-error" className="text-xs text-brand-bright mt-1">{errors.direccion}</p>
            )}
          </div>
          <div>
            <Label htmlFor="tel">Número de contacto</Label>
            <Input
              id="tel"
              type="tel"
              value={telefono}
              onChange={(e) => { setTelefono(e.target.value); setErrors((p) => ({ ...p, telefono: undefined })); }}
              inputMode="tel"
              maxLength={20}
              autoComplete="tel"
              aria-invalid={!!errors.telefono}
              aria-describedby={errors.telefono ? "tel-error" : undefined}
            />
            {errors.telefono && (
              <p id="tel-error" className="text-xs text-brand-bright mt-1">{errors.telefono}</p>
            )}
          </div>
          <div>
            <Label>Medio de pago</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {opciones.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setPago(o)}
                  className={`focus-ring px-3 py-2 rounded-full text-sm border transition ${
                    pago === o
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border hover:bg-muted"
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>
          {/* Habilitado siempre a propósito: un botón muerto no explica qué
              falta. Al tocarlo, validate() señala el campo incompleto. */}
          <Button
            onClick={enviar}
            disabled={enviando}
            size="lg"
            className="w-full bg-gradient-brand text-brand-foreground"
          >
            <Send className="h-4 w-4 mr-2" /> Enviar por WhatsApp
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
