import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * El asiento de la portada de marca, todavía vacío.
 *
 * Aquí va a vivir la landing: el lema, la historia, y desde ahí un camino al
 * menú. Mientras no exista, esta ruta redirige a /menu en vez de mostrar un
 * placeholder: "/" es el enlace que está hoy en la bio de Instagram y por él
 * entra gente con hambre. Un stub a medio construir en esa dirección es un
 * pedido perdido; un salto de una ruta a otra, del lado del cliente, no.
 *
 * Cuando la landing esté lista, se borra el `beforeLoad` y se pone su
 * componente. No hace falta tocar nada más.
 */
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/menu" });
  },
});
