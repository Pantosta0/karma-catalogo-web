import { createFileRoute, Link } from "@tanstack/react-router";
import { Fragment, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useAppState } from "@/lib/app-store";
import { getIsOpen, groupSchedule } from "@/lib/schedule";
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
  );
}

/**
 * ¿Ya se vio esto? Una vez que sí, para siempre sí.
 *
 * Veinte líneas en vez de `useInView` de Motion. No es purismo: importar ese
 * hook arrastra el runtime de Motion al chunk de esta ruta, y con el barrido y
 * la ola resueltos en CSS no quedaba nada más que lo necesitara. La portada
 * pasó a no cargar librería de animación alguna, que es exactamente lo que
 * conviene en la pantalla que abre alguien con datos móviles.
 *
 * Sin `IntersectionObserver` se da por visto de entrada. Es la decisión
 * correcta en la dirección segura: en el peor caso alguien se pierde una
 * animación, nunca un párrafo.
 */
function useInViewOnce(ref: RefObject<Element | null>, amount = 0.4) {
  const [visto, setVisto] = useState(false);

  useEffect(() => {
    if (visto) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisto(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada.isIntersecting) return;
        setVisto(true);
        io.disconnect();
      },
      { threshold: amount },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, amount, visto]);

  return visto;
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
      {/*
        La secuencia con autoría de la portada: se dicta una sentencia.

        La marca se llena, la acusación sube, un compás, y sube el premio. Todo
        con el mismo barrido de clip-path de abajo hacia arriba — el gesto que
        el sistema ya tenía en el loader y que no usaba en ningún otro sitio.
        Una sola idea material sostiene la pantalla en vez de cuatro efectos
        que no se conocen entre sí.

        Los tiempos se solapan a propósito: encadenados de verdad esto duraría
        tres segundos y se sentiría una cola. Solapados se lee como un gesto
        continuo y termina sobre los 1.6 s.
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
        {/* `inline-block` en cada línea porque el clip-path recorta la caja del
            elemento, y una caja de línea inline no tiene la altura de su texto:
            sin esto el barrido corta por donde no es. */}
        <span className="karma-wipe block" style={{ animationDelay: "0.35s" }}>
          Sabes lo que hiciste.
        </span>
        <span className="karma-wipe block" style={{ animationDelay: "0.68s" }}>
          Te lo mereces hoy.
        </span>
      </h1>

      <p
        className="karma-rise mt-5 max-w-md text-base sm:text-lg text-muted-foreground"
        style={{ animationDelay: "1.05s" }}
      >
        Hamburguesas, asados y picadas. Pedido directo por WhatsApp, sin apps de por medio.
      </p>

      <div
        className="karma-rise mt-8 flex flex-col items-center gap-4"
        style={{ animationDelay: "1.2s" }}
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

/**
 * El veredicto, frase por frase, para el barrido de lectura.
 *
 * Partido a mano y no con un `split(/\./)`: el texto tiene dos puntos, rayas y
 * un «11:00» de vecino, y una expresión regular que hoy acierta se rompe con la
 * próxima edición. Además así se decide dónde respira la frase, que es la mitad
 * del efecto — «Aquí no preguntamos.» aguanta sola, y la enumeración larga que
 * la sigue pasa de corrido.
 */
const VEREDICTO: string[][] = [
  ["Karma no es un castigo.", "Es una cuenta que se salda."],
  [
    "Tuviste una semana larga.",
    "Cerraste el mes.",
    "Sobreviviste el lunes.",
    "Lo que sea que hiciste —y sabes lo que hiciste— hoy vuelve en forma de hamburguesa.",
  ],
  [
    "Aquí no preguntamos.",
    "Parrilla, candela y una carta corta: hamburguesas que no piden permiso, asados como en casa, desgranados que llenan de verdad y picadas para cuando son varios.",
  ],
  [
    "Y pides directo.",
    "Sin apps de por medio, sin nadie cobrando comisión encima de tu comida.",
    "Escribes por WhatsApp y te responde la cocina.",
  ],
];

/**
 * El ritmo de la cabeza de lectura, ahora medido en scroll y no en tiempo.
 *
 * Ya no hay reloj: la posición de la página es la que manda. Estos números
 * dejaron de ser milisegundos y pasaron a ser distancia — cuánto recorrido le
 * toca a cada letra dentro de la sección. Que el punto siga costando catorce
 * veces más que una letra es lo que hace que la frase respire donde respira al
 * leerla en voz alta, sólo que ahora ese respiro se paga con dedo y no con
 * espera. Quien va rápido llega rápido; nadie se queda mirando.
 */
const CHAR_STEP = 16; // avance por letra
const PERIOD_STEP = 220; // el respiro en el punto
const LEAD_STEP = 260; // margen antes de que arranque la primera letra
const TAIL_STEP = 700; // margen al final: la última frase se lee antes de soltar

/**
 * El texto partido en párrafos → palabras → letras, con el retraso de cada
 * letra ya calculado. Se hace una vez al cargar el módulo porque el texto es
 * constante; rehacerlo en cada render sería trabajo por nada.
 *
 * La palabra existe como nivel intermedio por una razón de maquetación, no de
 * animación: cada letra tiene que ser `inline-block` para poder escalar, y una
 * fila de `inline-block` sueltos se puede partir entre dos letras cualesquiera
 * al final de la línea. Envolver cada palabra y prohibirle el salto dentro
 * mantiene el corte donde el idioma lo espera.
 */
const VEREDICTO_TIMED = (() => {
  let acc = LEAD_STEP;
  const parrafos = VEREDICTO.map((parrafo) =>
    parrafo.map((frase) => {
      const palabras = frase.split(" ").map((palabra) => {
        const letras = [...palabra].map((letra) => {
          const pos = acc;
          acc += CHAR_STEP;
          return { letra, pos };
        });
        acc += CHAR_STEP; // el espacio también ocupa su turno
        return letras;
      });
      acc += PERIOD_STEP;
      return { palabras, texto: frase };
    }),
  );
  return { parrafos, total: acc + TAIL_STEP };
})();

/**
 * El texto se lee al ritmo del scroll: la página avanza, la cabeza de lectura
 * avanza con ella, y cada letra aparece grande y se asienta a su paso.
 *
 * Es scroll ligado, no scroll secuestrado, y la diferencia importa. Nadie
 * bloquea la rueda ni el dedo: la sección simplemente es alta y se queda pegada
 * mientras se la recorre, así que pasar por encima del texto *es* revelarlo.
 * Quien va con prisa lo llena de un manotazo y sigue; quien vuelve atrás lo ve
 * rebobinar. Atrapar el scroll habría roto el teclado, peleado con el impulso
 * del dedo en móvil, y contradicho el principio 2 de PRODUCT.md — cualquier
 * paso metido delante del pedido se cuenta como pérdida.
 *
 * Tres cosas que parecen detalle y no lo son:
 *
 * El coste por fotograma es una escritura, no cuatrocientas. `--p` vive en el
 * contenedor y baja por herencia; cada letra lleva su `--i` fijo y resuelve su
 * propia opacidad y escala en CSS. Mover el scroll sólo toca el padre.
 *
 * El crecimiento va por `transform` y jamás por `font-size`. Cambiar el tamaño
 * de fuente de una letra cambia su caja, empuja a las vecinas y vuelve a partir
 * las líneas en cada fotograma: el párrafo entero temblaría mientras pasa la
 * ola. `transform` no toca el layout.
 *
 * Y el texto animado va `aria-hidden` con una copia limpia al lado para el
 * lector de pantalla. Partir un párrafo en cuatrocientos spans de una letra es
 * exactamente la clase de cosa que hace que VoiceOver lo deletree. La copia es
 * el texto de verdad; los spans son decoración.
 */
function Veredicto() {
  const pistaRef = useRef<HTMLElement>(null);
  const textoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const pista = pistaRef.current;
    const texto = textoRef.current;
    if (!pista || !texto) return;

    // Si el navegador no puede hacer sticky, la sección se queda alta y el
    // texto pasaría de largo sin encenderse. Mejor dejarlo encendido y quieto.
    if (!CSS.supports?.("position", "sticky")) {
      texto.style.setProperty("--p", String(VEREDICTO_TIMED.total));
      return;
    }

    let pendiente = 0;

    const medir = () => {
      pendiente = 0;
      const caja = pista.getBoundingClientRect();
      // Recorrido útil: lo que sobra de la pista una vez descontada la pantalla
      // que se queda pegada.
      const recorrido = caja.height - window.innerHeight;
      const avance = recorrido > 0 ? Math.min(Math.max(-caja.top, 0), recorrido) / recorrido : 1;
      texto.style.setProperty("--p", (avance * VEREDICTO_TIMED.total).toFixed(1));
    };

    const alHacerScroll = () => {
      // Un rAF como mucho por fotograma: el scroll dispara muy por encima de la
      // tasa de refresco y medir de más no pinta ni un pixel de más.
      if (!pendiente) pendiente = requestAnimationFrame(medir);
    };

    medir();
    window.addEventListener("scroll", alHacerScroll, { passive: true });
    window.addEventListener("resize", alHacerScroll);
    return () => {
      window.removeEventListener("scroll", alHacerScroll);
      window.removeEventListener("resize", alHacerScroll);
      if (pendiente) cancelAnimationFrame(pendiente);
    };
  }, []);

  return (
    // La altura es el reloj: dos pantallas y media de recorrido para las
    // cuatrocientas letras. Más corto y la ola va tan rápida que no se lee;
    // más largo y la sección se convierte en un peaje.
    <section ref={pistaRef} className="karma-runway relative h-[250vh]">
      <div className="karma-sticky sticky top-0 flex min-h-[100svh] items-center">
        {/* Aquí había un «EL VEREDICTO» en versalitas encima del texto. Fuera:
            un rótulo sobre un bloque no le añade nada que el bloque no diga
            solo, y «Karma no es un castigo.» abre mejor que una etiqueta que
            anuncia que va a abrir algo. */}
        <div
          ref={textoRef}
          className="karma-veredicto mx-auto w-full max-w-5xl px-4 py-20 sm:py-28"
        >
          {/* 34rem: la medida de lectura del sistema. El contenedor de 64rem es
              casi un tercio demasiado ancho para prosa seguida. */}
          <div className="max-w-[34rem] space-y-5 text-base leading-[1.75] tracking-[0.006em]">
            {VEREDICTO_TIMED.parrafos.map((parrafo, i) => (
              <p key={i}>
                {/* La versión que lee la gente con lector de pantalla. */}
                <span className="sr-only">{parrafo.map((f) => f.texto).join(" ")}</span>

                <span aria-hidden="true">
                  {parrafo.map(({ palabras, texto }) =>
                    palabras.map((letras, k) => (
                      // El espacio va fuera del `inline-block` y como texto
                      // normal: es el único punto donde la línea puede partir,
                      // y la palabra en bloque es lo que impide que parta entre
                      // dos letras.
                      <Fragment key={`${texto}-${k}`}>
                        <span className="inline-block whitespace-nowrap">
                          {letras.map(({ letra, pos }, l) => (
                            <span key={l} className="karma-char" style={{ "--i": pos } as never}>
                              {letra}
                            </span>
                          ))}
                        </span>{" "}
                      </Fragment>
                    )),
                  )}
                </span>
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Destacados() {
  const { state, loading } = useAppState();

  const ref = useRef<HTMLElement>(null);
  const visto = useInViewOnce(ref, 0.2);

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
    // La sección entera ya no entra flotando. Antes las tres secciones de abajo
    // hacían exactamente la misma subida, que es un tic, no un lenguaje: lo que
    // aquí aparece es una lista, así que lo que se escalona son sus platos.
    <section ref={ref} className="max-w-5xl mx-auto px-4 py-20 sm:py-28">
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
          : platos.map((p, i) => (
              <Link
                key={p.id}
                to="/menu/$categoria"
                params={{ categoria: p.categorias[0] ?? "todos" }}
                // Escalonado corto y con tope: tres platos a 90 ms son 180 ms
                // de cola. Un escalonado que se nota esperando deja de leerse
                // como una lista llegando y empieza a leerse como lentitud.
                className={`focus-ring group bg-card rounded-2xl overflow-hidden border border-border/60 shadow-card hover:-translate-y-0.5 transition ${
                  visto ? "karma-rise" : "karma-pending"
                }`}
                style={visto ? { animationDelay: `${i * 90}ms` } : undefined}
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
    </section>
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
    // Sin entrada. Esta sección son horarios y una dirección: datos que alguien
    // viene a comprobar, no un momento que haya que presentar. Animarla sólo
    // porque está ahí es lo que convierte una portada en una feria.
    <section className="max-w-5xl mx-auto px-4 py-20 sm:py-28">
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
    </section>
  );
}
