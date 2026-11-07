/**
 * Utilidades para procesar, dimensionar y convertir imágenes locales a Data URLs Base64
 * seguras para persistencia sin dependencias externas y exportación offline garantizada.
 */

export interface ProcessedImage {
  url: string;
  width: number;
  height: number;
  title: string;
}

export function readImageFileAsDataUrl(file: File, maxDim = 260): Promise<ProcessedImage> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('El archivo seleccionado no es una imagen válida.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      const url = e.target?.result as string;
      if (!url) {
        reject(new Error('No se pudo leer el contenido de la imagen.'));
        return;
      }

      const img = new Image();
      img.onload = () => {
        let w = img.naturalWidth || 240;
        let h = img.naturalHeight || 180;

        // Escalar armónicamente manteniendo el aspect ratio original
        if (w > maxDim || h > maxDim) {
          const ratio = w / h;
          if (w >= h) {
            w = maxDim;
            h = Math.round(maxDim / ratio);
          } else {
            h = maxDim;
            w = Math.round(maxDim * ratio);
          }
        }

        w = Math.max(70, Math.round(w));
        h = Math.max(50, Math.round(h));

        resolve({
          url,
          width: w,
          height: h,
          title: file.name.replace(/\.[^/.]+$/, ''),
        });
      };

      img.onerror = () => {
        resolve({
          url,
          width: 220,
          height: 160,
          title: file.name,
        });
      };

      img.src = url;
    };

    reader.onerror = err => reject(err);
    reader.readAsDataURL(file);
  });
}
