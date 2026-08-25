/**
 * Punto de corte del bundle de Motion.
 *
 * Existe sólo para que `import()` tenga un módulo pequeño al que apuntar: lo
 * que se lleve este archivo es lo que pesa el chunk de animación. Ver
 * `loadDomAnimation` en `motion.ts`.
 */
export { domAnimation as default } from "motion/react";
