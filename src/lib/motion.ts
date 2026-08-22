/**
 * Vocabulario de movimiento.
 *
 * `styles.css` ya fija la postura de la casa: el único momento con autoría es
 * el logo llenándose de color; lo demás es acuse de recibo. Este archivo no
 * abre una segunda gramática, la continúa — las curvas de abajo son las mismas
 * que ya usan `.slider-indicator` y `karma-fill`, para que lo que anime desde
 * JS no se sienta de otro sitio que lo que anima desde CSS.
 *
 * Cómo se monta. El proveedor va en la ruta que anima, NO en `__root.tsx`:
 *
 *   <LazyMotion features={loadDomAnimation} strict>
 *
 * Las dos cosas importan y las dos se midieron.
 *
 * `features={loadDomAnimation}` y no `features={domAnimation}`: pasar el objeto
 * importado de forma estática mete las features en el bundle igual que si no
 * hubiera `LazyMotion`. Medido en este proyecto: +24 kB gzip sobre el chunk
 * compartido. Con la función, Motion las baja aparte cuando hace falta.
 *
 * En la ruta y no en la raíz: el proveedor en `__root.tsx` carga en todas las
 * rutas, y /menu es por donde entra alguien con hambre y datos móviles. Que la
 * portada pague su animación, no el menú.
 *
 * `strict` hace que `motion.*` lance en vez de funcionar. Es deliberado:
 * `motion.*` arrastra el paquete entero, y la única forma de que eso no pase
 * por descuido es que falle ruidosamente. Se usa `m.*`.
 *
 * `prefers-reduced-motion` no se comprueba aquí: Motion lo respeta solo cuando
 * la animación es de transformación, pero para decidir *qué* animar usa
 * `useReducedMotion()` en el componente, igual que el bloque de CSS quita el
 * desplazamiento y conserva lo que informa.
 */

/** Carga diferida de las features de Motion. Ver la nota de arriba: pasar esto
 *  y no el objeto es lo que mantiene la animación fuera del chunk compartido. */
export const loadDomAnimation = () =>
  import("./motion-features").then((m) => m.default);

/** La curva de `.slider-indicator`. Sale rápido y frena largo: para cosas que
 *  se desplazan o entran. */
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/** La curva de `karma-fill`. Simétrica: para rellenos y barridos. */
export const EASE_IN_OUT = [0.4, 0, 0.2, 1] as const;

export const DURATION = {
  /** Acuse de recibo: un botón que responde al dedo. */
  tap: 0.12,
  /** El estándar de la casa — lo que dura el indicador de categoría. */
  base: 0.22,
  /** Entradas de sección en la portada. */
  enter: 0.45,
} as const;

/** Entrada estándar: sube un poco y aparece. El desplazamiento es corto a
 *  propósito; un recorrido largo se lee como una web de plantilla. */
export const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: DURATION.enter, ease: EASE_OUT },
};

/** La misma entrada sin desplazamiento, para `useReducedMotion()`. */
export const fadeOnly = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: DURATION.enter, ease: EASE_OUT },
};
