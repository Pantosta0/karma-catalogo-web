import React from "react";

/** Decoración de fondo: sticker sheet esparcida por los bordes.
 *  mix-blend-mode: screen elimina el fondo negro de la imagen
 *  y deja visibles solo los stickers sobre el fondo oscuro del sitio.
 *
 *  Requiere: public/stickers-sheet.jpg
 */

type Placement = {
  style: React.CSSProperties;
};

const PLACEMENTS: Placement[] = [
  // Esquina superior izquierda
  {
    style: {
      top: -50, left: -90, width: 380,
      transform: "rotate(-9deg)",
      transformOrigin: "top left",
      opacity: 0.2,
    },
  },
  // Esquina superior derecha
  {
    style: {
      top: -60, right: -70, width: 350,
      transform: "rotate(13deg)",
      transformOrigin: "top right",
      opacity: 0.18,
    },
  },
  // Esquina inferior izquierda
  {
    style: {
      bottom: -40, left: -60, width: 390,
      transform: "rotate(8deg)",
      transformOrigin: "bottom left",
      opacity: 0.19,
    },
  },
  // Esquina inferior derecha
  {
    style: {
      bottom: -50, right: -80, width: 360,
      transform: "rotate(-11deg)",
      transformOrigin: "bottom right",
      opacity: 0.18,
    },
  },
  // Borde izquierdo, mitad vertical
  {
    style: {
      top: "38%", left: -160, width: 370,
      transform: "translateY(-50%) rotate(20deg)",
      transformOrigin: "center left",
      opacity: 0.12,
    },
  },
  // Borde derecho, mitad vertical
  {
    style: {
      top: "44%", right: -155, width: 355,
      transform: "translateY(-50%) rotate(-17deg)",
      transformOrigin: "center right",
      opacity: 0.12,
    },
  },
];

export function StickerBackground() {
  return (
    <div
      className="fixed inset-0 -z-10 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      {PLACEMENTS.map(({ style }, i) => (
        <img
          key={i}
          src="/stickers-sheet.jpg"
          alt=""
          draggable={false}
          className="absolute select-none"
          style={{
            ...style,
            mixBlendMode: "screen",
          }}
        />
      ))}
    </div>
  );
}
