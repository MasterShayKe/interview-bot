import * as THREE from "three";
import { clusterHue, type PortalProject } from "./projects.js";

const ACCENT = new THREE.Color("#c6f24e");

/** A single thing you learn by walking up to a landmark on the star. */
export interface SurfaceFact {
  tag: string;
  text: string;
  url?: string;
}

function tinted(hueShift: number, lift = 0.04): THREE.Color {
  const hsl = { h: 0, s: 0, l: 0 };
  ACCENT.getHSL(hsl);
  return new THREE.Color().setHSL(
    (hsl.h + hueShift + 1) % 1,
    Math.min(1, hsl.s * 0.95),
    Math.min(0.85, hsl.l + lift),
  );
}

export function clusterColor(p: PortalProject): THREE.Color {
  return tinted(clusterHue[p.cluster], 0.06);
}

/** The landmarks the astronaut walks between — derived from verified fields. */
export function projectFacts(p: PortalProject): SurfaceFact[] {
  return [
    { tag: "Mission", text: p.tagline },
    { tag: "What it does", text: p.summary },
    { tag: "Stack", text: p.stack.join("   ·   ") },
    {
      tag: p.link.url ? "Link" : "Status",
      text: p.link.label,
      url: p.link.url,
    },
  ];
}

// Tiny deterministic RNG so each star's terrain is unique but stable.
function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Equirectangular texture for the star: cluster-tinted ground, seeded craters,
 * and the project title/tagline literally printed across the surface.
 */
export function makeSurfaceTexture(p: PortalProject): THREE.CanvasTexture {
  const w = 1024;
  const h = 512;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  const base = clusterColor(p);
  const dark = base.clone().multiplyScalar(0.35);
  const lite = base.clone().multiplyScalar(0.7);

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, `#${lite.getHexString()}`);
  grad.addColorStop(0.5, `#${base.clone().multiplyScalar(0.5).getHexString()}`);
  grad.addColorStop(1, `#${dark.getHexString()}`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  const rand = mulberry32(hashString(p.id));

  // Craters / surface mottling.
  for (let i = 0; i < 90; i++) {
    const cx = rand() * w;
    const cy = rand() * h;
    const r = 6 + rand() * 46;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    const shade = rand() > 0.5 ? dark : lite;
    g.addColorStop(0, `rgba(${(shade.r * 255) | 0},${(shade.g * 255) | 0},${(shade.b * 255) | 0},0.5)`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Printed title across the surface.
  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "700 88px 'Schibsted Grotesk', system-ui, sans-serif";
  ctx.fillText(p.title.toUpperCase(), w / 2, h * 0.42);
  ctx.globalAlpha = 0.12;
  ctx.font = "500 30px 'JetBrains Mono', monospace";
  ctx.fillText(p.tagline.toUpperCase(), w / 2, h * 0.58);
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Billboard label that floats over a landmark obelisk. */
export function makeLabelSprite(text: string): THREE.Sprite {
  const w = 320;
  const h = 96;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "rgba(10,11,13,0.7)";
  const r = 16;
  ctx.beginPath();
  ctx.roundRect(2, 2, w - 4, h - 4, r);
  ctx.fill();
  ctx.strokeStyle = "rgba(198,242,78,0.5)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "#c6f24e";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "600 34px 'JetBrains Mono', monospace";
  ctx.fillText(text.toUpperCase(), w / 2, h / 2 + 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }),
  );
  sprite.scale.set(1.7, 0.51, 1);
  return sprite;
}
