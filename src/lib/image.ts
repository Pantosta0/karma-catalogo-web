/**
 * Comprime una imagen con Canvas y devuelve bytes listos para subir.
 *
 * Devuelve un Blob y no un data URL: Storage guarda archivos, y el base64
 * infla ~4/3 sobre el binario, así que el Blob es también lo que queremos que
 * viaje por la red.
 */
export function compressImageToBlob(
  file: File,
  maxDimension: number,
  format: "jpeg" | "png" = "jpeg",
  quality = 0.85,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width >= height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas no soportado"));
        return;
      }

      // Fondo blanco para jpeg: evita píxeles negros donde había transparencia.
      if (format === "jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
      }
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("No se pudo codificar la imagen"))),
        `image/${format}`,
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("No se pudo cargar la imagen"));
    };

    img.src = objectUrl;
  });
}
