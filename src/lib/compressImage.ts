/**
 * Compresses an image file in the browser using Canvas.
 * Keeps visual quality high while reducing file size to under maxMB.
 * Useful before uploading to Vercel (which has a 4.5MB serverless body limit).
 */
export async function compressImage(
  file: File,
  maxMB = 3.5,
  quality = 0.88,
): Promise<File> {
  // Already small enough — skip compression
  if (file.size <= maxMB * 1024 * 1024) return file;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Scale down if very large (> 2400px on longest side)
      const MAX_SIDE = 2400;
      let { width, height } = img;
      if (width > MAX_SIDE || height > MAX_SIDE) {
        if (width > height) {
          height = Math.round((height / width) * MAX_SIDE);
          width = MAX_SIDE;
        } else {
          width = Math.round((width / height) * MAX_SIDE);
          height = MAX_SIDE;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Compression failed"));
          const compressed = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
          resolve(compressed);
        },
        "image/jpeg",
        quality,
      );
    };
    img.onerror = () => reject(new Error("Could not load image for compression"));
    img.src = url;
  });
}
