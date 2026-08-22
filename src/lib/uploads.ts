import { supabase } from "./supabase";
import { compressImageToBlob } from "./image";
import { uid } from "./storage";

/**
 * Subida de imágenes a Supabase Storage.
 *
 * Antes las fotos se guardaban como data URL base64 dentro de la propia fila de
 * `productos`, así que viajaban en el `select("*")` que bloquea el primer render
 * del menú: ~2–4 MB de JSON antes de ver un solo plato. Un data URL tampoco se
 * puede cachear aparte, ni servir en WebP, ni cargar en diferido — los bytes ya
 * llegaron con los datos.
 *
 * Aquí la imagen se sube al bucket y en la fila queda sólo su URL. El campo
 * `foto` acepta ambas formas (`<img src>` no distingue), así que las filas
 * viejas en base64 siguen funcionando sin migración: cada producto se convierte
 * la próxima vez que alguien le cambia la foto.
 */

export const BUCKET = "product-photos";

export type UploadFolder = "productos" | "promos" | "logos";

/** Una URL de nuestro bucket, frente a un data URL heredado o algo externo. */
export function isStoredUpload(value: string): boolean {
  return value.includes(`/storage/v1/object/public/${BUCKET}/`);
}

/** Deriva la ruta dentro del bucket a partir de la URL pública. */
function pathFromPublicUrl(url: string): string | null {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : url.slice(i + marker.length).split("?")[0];
}

/**
 * Comprime y sube una imagen. Devuelve la URL pública.
 *
 * @param previous Valor anterior del campo. Si era una subida nuestra, se borra
 *   después de que la nueva quede arriba — sin esto el bucket acumula huérfanas
 *   cada vez que alguien cambia una foto.
 */
export async function uploadImage(
  file: File,
  opts: {
    folder: UploadFolder;
    maxDimension: number;
    format?: "jpeg" | "png";
    quality?: number;
    previous?: string;
  },
): Promise<string> {
  const format = opts.format ?? "jpeg";
  const blob = await compressImageToBlob(file, opts.maxDimension, format, opts.quality);

  const ext = format === "png" ? "png" : "jpg";
  const path = `${opts.folder}/${uid()}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: `image/${format}`,
    cacheControl: "31536000", // inmutable: el nombre lleva un id único
    upsert: false,
  });

  if (error) {
    // El caso habitual es que el bucket no exista todavía. Antes de volver a
    // base64 en silencio —que reintroduce el problema sin avisar— se falla
    // claro y quien llama lo muestra en un toast.
    throw new Error(
      `No se pudo subir la imagen: ${error.message}. ` +
        `Verifica que el bucket "${BUCKET}" exista y sea público.`,
    );
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

  if (opts.previous && isStoredUpload(opts.previous)) {
    const old = pathFromPublicUrl(opts.previous);
    // Best-effort: si el borrado falla queda una huérfana, que es mucho menos
    // grave que perder la imagen nueva.
    if (old) await supabase.storage.from(BUCKET).remove([old]).catch(() => {});
  }

  return data.publicUrl;
}

/** Borra una imagen subida. Ignora data URLs heredados y URLs externas. */
export async function removeUpload(value: string): Promise<void> {
  if (!value || !isStoredUpload(value)) return;
  const path = pathFromPublicUrl(value);
  if (path) await supabase.storage.from(BUCKET).remove([path]).catch(() => {});
}
