import type { BotTheme } from "./api.js";

const DEFAULT_ACCENT = "198 242 78";
const DEFAULT_ACCENT_DIM = "155 191 62";

/** "#C6F24E" -> "198 242 78" (the space-separated triplet Tailwind expects). */
function hexToTriplet(hex: string): string | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

/** Darken a "#rrggbb" by a factor (0..1) for the dim accent. */
function darken(hex: string, factor = 0.78): string | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const r = Math.round(((n >> 16) & 255) * factor);
  const g = Math.round(((n >> 8) & 255) * factor);
  const b = Math.round((n & 255) * factor);
  return `${r} ${g} ${b}`;
}

/** Apply a bot's accent color to the document (or reset to default). */
export function applyAccent(theme: BotTheme | undefined): void {
  const root = document.documentElement;
  const triplet = theme?.accent ? hexToTriplet(theme.accent) : null;
  if (triplet) {
    root.style.setProperty("--accent-rgb", triplet);
    const dim = theme?.accentDim
      ? hexToTriplet(theme.accentDim)
      : darken(theme!.accent!);
    root.style.setProperty("--accent-dim-rgb", dim ?? triplet);
  } else {
    resetAccent();
  }
}

/** Revert to the stylesheet default accent. */
export function resetAccent(): void {
  const root = document.documentElement;
  root.style.setProperty("--accent-rgb", DEFAULT_ACCENT);
  root.style.setProperty("--accent-dim-rgb", DEFAULT_ACCENT_DIM);
}

/**
 * Reads an image File and returns a downscaled data URL (max `maxDim` px,
 * JPEG/PNG), so avatars/logos stay small enough to store inline in the bot's
 * theme JSON. Keeps PNG for transparency, otherwise JPEG.
 */
export function fileToResizedDataUrl(
  file: File,
  maxDim = 256,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas unsupported"));
      ctx.drawImage(img, 0, 0, w, h);
      const isPng = /png/i.test(file.type);
      resolve(canvas.toDataURL(isPng ? "image/png" : "image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    img.src = url;
  });
}
