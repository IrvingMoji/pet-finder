/**
 * Comprime una imagen en el cliente usando la API de Canvas.
 * Convierte el archivo a JPEG con dimensiones máximas y calidad reducida.
 * 
 * @param {File} file - El objeto File de la imagen original.
 * @param {number} maxWidth - Ancho máximo permitido.
 * @param {number} maxHeight - Alto máximo permitido.
 * @param {number} quality - Calidad JPEG (0 a 1).
 * @returns {Promise<string>} - Una promesa que resuelve con el string Base64 optimizado.
 */
export const compressImage = (file, maxWidth = 1024, maxHeight = 1024, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error("El archivo no es una imagen válida"));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calcular nuevas dimensiones manteniendo la relación de aspecto
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Dibujar y comprimir
        ctx.fillStyle = "white"; // Fondo blanco para JPEGs con transparencia
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        
        const optimizedBase64 = canvas.toDataURL('image/jpeg', quality);
        console.log(`[ImageUtils] Original: ${(file.size / 1024).toFixed(2)}KB, Comprimido: ${(optimizedBase64.length / 1024).toFixed(2)}KB`);
        resolve(optimizedBase64);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};
