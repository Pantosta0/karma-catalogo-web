/**
 * Comprime una imagen usando Canvas API antes de almacenarla como data URL.
 * No requiere librerías externas.
 *
 * @param file        Archivo original del input
 * @param maxDimension Lado máximo en píxeles (ancho o alto)
 * @param format      'jpeg' para fotos, 'png' para logos con transparencia
 * @param quality     0–1, solo aplica para jpeg (png ignora quality)
 */
export function compressImage(
  file: File,
  maxDimension: number,
  format: "jpeg" | "png" = "jpeg",
  quality = 0.85,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Reducir si supera la dimensión máxima
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
        reject(new Error("Canvas not supported"));
        return;
      }

      // Fondo blanco para jpeg (evita píxeles negros donde había transparencia)
      if (format === "jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
      }

      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL(`image/${format}`, quality));
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("No se pudo cargar la imagen"));
    };

    img.src = objectUrl;
  });
}
