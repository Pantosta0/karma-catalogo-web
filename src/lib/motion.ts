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
export const loadDomAnimation = () => import("./motion-features").then((m) => m.default);

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
  /**
   * Entradas de sección en la portada.
   *
   * Estaba en 0.45 y no se veía. Medido en el navegador con esa curva: la
   * opacidad llegaba a 0.48 a los 51 ms y a 0.89 a los 152 ms — o sea que
   * nueve décimas del efecto pasaban antes de que el ojo lo registrara como
   * movimiento. EASE_OUT arranca muy rápido a propósito (para eso sirve en el
   * indicador de categoría, que tiene que sentirse inmediato), así que una
   * entrada con esta curva necesita más tiempo, no menos.
   */
  enter: 0.7,
} as const;

/**
 * Entrada estándar: sube y aparece.
 *
 * El recorrido es corto porque uno largo se lee como plantilla, pero 12 px con
 * la curva de la casa era directamente imperceptible. 28 px es lo mínimo que se
 * lee como que algo entró sin que parezca que la sección viene volando.
 */
export const fadeUp = {
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: DURATION.enter, ease: EASE_OUT },
};

/** La misma entrada sin desplazamiento, para `useReducedMotion()`. */
export const fadeOnly = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: DURATION.enter, ease: EASE_OUT },
};
