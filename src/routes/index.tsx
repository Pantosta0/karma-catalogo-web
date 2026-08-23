import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { LazyMotion, m, useInView, useReducedMotion } from "motion/react";
import { useAppState } from "@/lib/app-store";
import { getIsOpen, groupSchedule } from "@/lib/schedule";
import { loadDomAnimation, fadeUp, fadeOnly } from "@/lib/motion";
import { SiteFooter } from "@/components/SiteFooter";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageOff, Instagram, MapPin, Clock, ArrowRight } from "lucide-react";
import type { Product } from "@/lib/storage";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

/** La marca en su tamaño nativo. El logo de alta resolución vive en la fila de
 *  `config` como base64 (~700 kB entre los dos) y no vale bloquear la portada
 *  por él; este archivo son 47 kB y ya está en disco. A 180 px de origen
 *  cualquier tamaño de pintado por debajo se ve nítido. */
const MARCA = "/apple-touch-icon.png";

function LandingPage() {
  return (
    // El proveedor va aquí y no en __root: /menu no tiene por qué pagar los
    // bytes de la animación de la portada. Ver la nota larga en lib/motion.ts.
    <LazyMotion features={loadDomAnimation} strict>
      <div className="min-h-screen">
        <LandingHeader />
        <main>
          <Hero />
          <Veredicto />
          <Destacados />
          <DondeYCuando />
        </main>
        <SiteFooter />
      </div>
    </LazyMotion>
  );
}

/**
 * Entrada de sección: sube y aparece, o sólo aparece si el sistema lo pide.
 *
 * `useInView` + `animate` y no `whileInView`, que es la forma corta y la que
 * uno escribiría primero. `whileInView` lo sirve la feature `inView`, y esa no
 * viene ni en `domAnimation` ni en `domMax` — sólo en el `motion` completo. Bajo
 * `LazyMotion` no falla ruidosamente: la prop se ignora y la sección se queda en
 * su estado inicial, es decir invisible para siempre. `useInView` es un hook
 * suelto sobre IntersectionObserver, no necesita feature alguna, y así el bundle
 * de animación se queda donde está.
 *
 * `once` porque una sección que se re-anima cada vez que vuelve a entrar en
 * pantalla convierte el scroll en un juguete.
 */
function Seccion({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  const preset = reduce ? fadeOnly : fadeUp;
  const ref = useRef<HTMLElement>(null);
  const visible = useInView(ref, { once: true, amount: 0.25 });

  return (
    <m.section
      ref={ref}
      initial={preset.initial}
      animate={visible ? preset.animate : preset.initial}
      transition={preset.transition}
      className={className}
    >
      {children}
    </m.section>
  );
}

/** Chip de estado: verde abre, rojo cierra. Devuelve null mientras el horario
 *  real no haya llegado — el horario por defecto del código no es el de Karma,
 *  y anunciar «Abierto» por adivinanza es peor que no decir nada. */
function EstadoChip({ isOpen }: { isOpen: boolean | null }) {
  if (isOpen === null) return null;
  return (
    <span
      className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
        isOpen
          ? "bg-green-500/20 text-green-400 border border-green-500/30"
          : "bg-red-500/20 text-red-400 border border-red-500/30"
      }`}
    >
      {isOpen ? "Abierto" : "Cerrado"}
    </span>
  );
}

/** Reloj compartido: el estado abierto/cerrado se recalcula cada 30 s y al
 *  volver a la pestaña, igual que en el menú. */
function useIsOpenNow() {
  const { state, loading } = useAppState();
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

  return useMemo(
    () => (loading ? null : getIsOpen(state.config.schedule)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.config.schedule, loading, now],
  );
}

function LandingHeader() {
  const { state } = useAppState();
  const isOpen = useIsOpenNow();
  const [scrolled, setScrolled] = useState(false);

  // Transparente sobre el hero, sólida en cuanto se despega. Un listener
  // simple y no `useScroll`: esto es un booleano, no un valor continuo.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-30 transition-colors duration-300 ${
        scrolled
          ? "backdrop-blur-md bg-background/85 border-b border-border/60"
          : "border-b border-transparent"
      }`}
    >
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
        <img src={MARCA} alt="" aria-hidden="true" className="h-10 w-10 object-contain shrink-0" />
        <span className="font-display text-xl text-brand-bright leading-none">
          {state.config.nombre || "Karma"}
        </span>
        <EstadoChip isOpen={isOpen} />
        <div className="flex-1" />
        {/* Crema, no el degradado: es el momento en que la portada entrega al
            visitante lo que vino a buscar. Ver «The Cream Rule» en DESIGN.md. */}
        <Link
          to="/menu"
          className="focus-ring inline-flex h-11 items-center rounded-full bg-secondary px-5 text-sm font-bold text-secondary-foreground hover:opacity-90 transition"
        >
          Pedir
        </Link>
      </div>
    </header>
  );
}

function Hero() {
  const { state } = useAppState();
  const isOpen = useIsOpenNow();

  return (
    // Sin datos de por medio: tipografía, un PNG de disco y nada más. Lo que
    // hay debajo puede esperar a Supabase; esto no.
    <section className="min-h-[100svh] flex flex-col items-center justify-center px-4 text-center">
      {/* El relleno del loader, una vez. Es el gesto con autoría de la marca y
          no se inventa uno nuevo para la portada. Capa gris debajo, capa a
          color revelándose de abajo hacia arriba encima. */}
      {/*
        La entrada escalonada va en CSS (`karma-rise`) y no en Motion: el hero
        no espera al chunk de animación, así que su propia animación tampoco
        puede depender de él. Los retrasos son cortos — la marca, la frase, la
        explicación, el botón — y el conjunto termina antes de los 1.2 s, que
        es más o menos lo que alguien tarda en decidir si se queda.
      */}
      <div className="karma-rise relative h-24 w-24 sm:h-28 sm:w-28 mb-8">
        <img
          src={MARCA}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-contain"
          style={{ filter: "grayscale(1) brightness(0.35)" }}
        />
        <img
          src={MARCA}
          alt={state.config.nombre || "Karma"}
          fetchPriority="high"
          className="karma-hero-fill absolute inset-0 h-full w-full object-contain"
        />
      </div>

      {/*
        Dos líneas, una por frase, forzadas con `block`.

        Anton nunca pasa de dos líneas en móvil (DESIGN.md), y dejar que el
        navegador decida dónde parte esta frase da tres en cuanto la pantalla
        es estrecha. Partirla por la puntuación es además donde la partiría
        alguien leyéndola en voz alta.

        Cada frase entra por separado: es una acusación y luego el premio, y
        se leen mejor una después de la otra que las dos de golpe.
      */}
      <h1 className="font-display font-bold text-brand-bright text-balance leading-[1.05] text-[clamp(2rem,8.5vw,4.5rem)]">
        <span className="karma-rise block" style={{ animationDelay: "0.15s" }}>
          Sabes lo que hiciste.
        </span>
        <span className="karma-rise block" style={{ animationDelay: "0.35s" }}>
          Te lo mereces hoy.
        </span>
      </h1>

      <p
        className="karma-rise mt-5 max-w-md text-base sm:text-lg text-muted-foreground"
        style={{ animationDelay: "0.55s" }}
      >
        Hamburguesas, asados y picadas. Pedido directo por WhatsApp, sin apps de por medio.
      </p>

      <div
        className="karma-rise mt-8 flex flex-col items-center gap-4"
        style={{ animationDelay: "0.7s" }}
      >
        <Link
          to="/menu"
          className="focus-ring inline-flex h-12 items-center justify-center rounded-md bg-gradient-brand px-8 text-base font-bold text-brand-foreground shadow-card hover:opacity-95 transition"
        >
          Ver el menú
        </Link>
        <EstadoChip isOpen={isOpen} />
      </div>
    </section>
  );
}

function Veredicto() {
  return (
    <Seccion className="max-w-5xl mx-auto px-4 py-20 sm:py-28">
      {/* El tratamiento «Stamp» de DESIGN.md: Anton diminuto con tracking
          extremo. Está reservado para momentos de ceremonia y aparece una sola
          vez en la página — el loader, que es su otro uso, no vive en esta ruta. */}
      <p className="font-display text-[0.6875rem] tracking-[0.35em] text-muted-foreground">
        El veredicto
      </p>
      {/* 34rem: la medida de lectura del sistema. El contenedor de 64rem es casi
          un tercio demasiado ancho para prosa seguida. */}
      <div className="mt-6 max-w-[34rem] space-y-5 text-base leading-[1.75] tracking-[0.006em]">
        <p>Karma no es un castigo. Es una cuenta que se salda.</p>
        <p>
          Tuviste una semana larga. Cerraste el mes. Sobreviviste el lunes. Lo que sea que hiciste
          —y sabes lo que hiciste— hoy vuelve en forma de hamburguesa.
        </p>
        <p>
          Aquí no preguntamos. Parrilla, candela y una carta corta: hamburguesas que no piden
          permiso, asados como en casa, desgranados que llenan de verdad y picadas para cuando son
          varios.
        </p>
        <p>
          Y pides directo. Sin apps de por medio, sin nadie cobrando comisión encima de tu comida.
          Escribes por WhatsApp y te responde la cocina.
        </p>
      </div>
    </Seccion>
  );
}

function Destacados() {
  const { state, loading } = useAppState();

  const platos: Product[] = useMemo(() => {
    const disponibles = state.productos.filter((p) => p.disponible);
    const marcados = disponibles.filter((p) => p.destacado);
    // Sin nada marcado la portada no se queda vacía: cae en los primeros con
    // foto, que es lo que hace que se vea deliberada desde el primer día.
    const base = marcados.length > 0 ? marcados : disponibles.filter((p) => p.foto);
    return base.slice(0, 3);
  }, [state.productos]);

  // Nada disponible y ya cargó: no hay sección que mostrar.
  if (!loading && platos.length === 0) return null;

  return (
    <Seccion className="max-w-5xl mx-auto px-4 py-20 sm:py-28">
      <h2 className="font-display text-2xl sm:text-3xl font-bold">Lo que nos piden</h2>
      <p className="mt-2 text-muted-foreground">Y lo que deberías pedir tú.</p>

      <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        {loading
          ? // Esqueletos y no un loader de pantalla completa: el hero de arriba
            // ya se leyó, y tapar la página entera lo desperdiciaría.
            [0, 1, 2].map((i) => (
              <div key={i} className="bg-card rounded-2xl overflow-hidden border border-border/60">
                <Skeleton className="aspect-square w-full rounded-none" />
                <div className="p-3">
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))
          : platos.map((p) => (
              <Link
                key={p.id}
                to="/menu/$categoria"
                params={{ categoria: p.categorias[0] ?? "todos" }}
                className="focus-ring group bg-card rounded-2xl overflow-hidden border border-border/60 shadow-card hover:-translate-y-0.5 transition"
              >
                <div className="aspect-square bg-muted overflow-hidden">
                  {p.foto ? (
                    <img
                      src={p.foto}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <ImageOff className="h-8 w-8" />
                    </div>
                  )}
                </div>
                {/* Sin precio: la portada presenta, el menú cotiza. */}
                <div className="p-3">
                  <h3 className="font-semibold text-sm sm:text-base leading-tight line-clamp-2">
                    {p.nombre}
                  </h3>
                </div>
              </Link>
            ))}
      </div>

      <Link
        to="/menu"
        className="focus-ring rounded mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-bright hover:underline underline-offset-4"
      >
        Ver la carta completa <ArrowRight className="h-4 w-4" />
      </Link>
    </Seccion>
  );
}

function DondeYCuando() {
  const { state, loading } = useAppState();
  const isOpen = useIsOpenNow();
  const filas = groupSchedule(state.config.schedule);

  const whatsapp = (state.config.whatsapp ?? "").replace(/\D/g, "");
  const instagram = (state.config.instagram ?? "").trim();
  const direccion = (state.config.direccion ?? "").trim();

  return (
    <Seccion className="max-w-5xl mx-auto px-4 py-20 sm:py-28">
      <h2 className="font-display text-2xl sm:text-3xl font-bold">Cuándo y dónde</h2>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 max-w-3xl">
        <div className="bg-card rounded-2xl border border-border/60 p-5">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-brand-bright shrink-0" />
            <h3 className="font-semibold">Horario</h3>
            <EstadoChip isOpen={isOpen} />
          </div>
          {loading ? (
            <div className="mt-4 space-y-2">
              <Skeleton className="h-4 w-40" />
            </div>
          ) : (
            <dl className="mt-4 space-y-1.5 text-sm">
              {filas.map((f) => (
                <div key={f.dias} className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{f.dias}</dt>
                  <dd className="tabular font-medium">{f.horario}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        {/* Sin dirección configurada no se pinta una tarjeta vacía: la columna
            desaparece y la de horario ocupa el ancho que le toque. */}
        {direccion && (
          <div className="bg-card rounded-2xl border border-border/60 p-5">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-brand-bright shrink-0" />
              <h3 className="font-semibold">Dónde estamos</h3>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{direccion}</p>
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        {whatsapp && (
          <a
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring inline-flex h-12 items-center justify-center rounded-md bg-gradient-brand px-6 text-sm font-bold text-brand-foreground hover:opacity-95 transition"
          >
            Escríbenos por WhatsApp
          </a>
        )}
        {instagram && (
          <a
            href={`https://instagram.com/${instagram}`}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-md border border-input px-6 text-sm font-semibold hover:bg-muted transition"
          >
            <Instagram className="h-4 w-4" />@{instagram}
          </a>
        )}
      </div>
    </Seccion>
  );
}
