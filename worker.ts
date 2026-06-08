/**
 * Worker mínimo: sirve los assets estáticos pero fuerza no-cache en HTML.
 * Los archivos JS/CSS tienen hashes en su nombre → se cachean para siempre.
 * El index.html nunca se cachea → el browser siempre pide la versión nueva.
 */

interface Env {
  ASSETS: Fetcher;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const response = await env.ASSETS.fetch(request);

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("text/html")) {
      const headers = new Headers(response.headers);
      headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
      headers.set("Pragma", "no-cache");
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }

    return response;
  },
};
