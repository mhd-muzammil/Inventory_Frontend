// Phone cameras produce 3–8 MB photos. A single transition can carry ten of them,
// so uploading the originals means pushing tens of megabytes over a mobile
// connection before "Confirm Transition" returns. These photos are only ever
// looked at on screen, so downscaling to 1600px and re-encoding as JPEG keeps them
// perfectly readable while cutting the payload by roughly 95%.

const MAX_DIMENSION = 1600;
const QUALITY = 0.8;

/**
 * Downscale + re-encode an image file for upload.
 *
 * Returns the original file untouched if it is not an image, is already small, or
 * if anything goes wrong — a slow upload beats a failed one.
 */
export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  // Already small enough that re-encoding would not pay for itself.
  if (file.size <= 300 * 1024) return file;

  try {
    const bitmap = await createImageBitmap(file);

    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", QUALITY),
    );
    if (!blob || blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return file;
  }
}

/** Compress several files at once. */
export const compressImages = (files: File[]): Promise<File[]> =>
  Promise.all(files.map(compressImage));
