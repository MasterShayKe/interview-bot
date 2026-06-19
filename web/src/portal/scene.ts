import * as THREE from "three";
import { clusterHue, type PortalProject } from "./projects.js";
import {
  clusterColor,
  makeLabelSprite,
  makeSurfaceTexture,
  projectFacts,
  type SurfaceFact,
} from "./surface.js";

// Palette pulled from the app's design tokens (index.css / tailwind.config.js).
const ACCENT = new THREE.Color("#c6f24e");
const INK = new THREE.Color("#0a0b0d");

interface SceneCallbacks {
  onHover: (index: number | null) => void;
  onSelect: (index: number) => void;
  onSurfaceFact: (fact: SurfaceFact | null) => void;
}

/** Tint the lime accent by a hue offset so each cluster reads distinctly. */
function tinted(hueShift: number, lift = 0.04): THREE.Color {
  const hsl = { h: 0, s: 0, l: 0 };
  ACCENT.getHSL(hsl);
  return new THREE.Color().setHSL(
    (hsl.h + hueShift + 1) % 1,
    Math.min(1, hsl.s * 0.95),
    Math.min(0.85, hsl.l + lift),
  );
}

/** Soft radial sprite texture for nebulae and planet atmospheres. */
function radialTexture(inner: string, outer = "rgba(0,0,0,0)"): THREE.Texture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const PLANET_RADIUS = 0.8;
const SURFACE_RADIUS = 4;
const ACTIVE_DOT = 0.86; // ~30° cap under the astronaut counts as "reached"

interface Landmark {
  group: THREE.Group;
  obelisk: THREE.Mesh;
  tip: THREE.Mesh;
  sprite: THREE.Sprite;
  dir: THREE.Vector3;
}

export class PortalScene {
  private container: HTMLElement;
  private labelLayer: HTMLElement;
  private projects: PortalProject[];
  private callbacks: SceneCallbacks;

  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();

  private galaxy!: THREE.Points;
  private starfields: THREE.Points[] = [];
  private nebulae: THREE.Sprite[] = [];
  private planets: THREE.Mesh[] = [];
  private planetGroups: THREE.Group[] = [];
  private planetHalos: THREE.Sprite[] = [];
  private astronaut!: THREE.Group;
  private alien!: THREE.Group;
  private alienArm!: THREE.Mesh;
  private labels: HTMLElement[] = [];

  // Surface ("walk on the star") mode.
  private mode: "system" | "surface" = "system";
  private surfaceRoot: THREE.Group | null = null;
  private surfacePlanet: THREE.Mesh | null = null;
  private landmarks: Landmark[] = [];
  private surfaceFacts: SurfaceFact[] = [];
  private activeLandmark: number | null = null;
  private dragging = false;
  private lastPointer = new THREE.Vector2();

  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2(-2, -2);
  private parallax = new THREE.Vector2(0, 0);
  private parallaxTarget = new THREE.Vector2(0, 0);
  private camPos = new THREE.Vector3(0, 0.8, 13);
  private camLookAt = new THREE.Vector3(0, 0, 0);
  private hovered: number | null = null;
  private reducedMotion: boolean;
  private running = true;
  private frame = 0;

  constructor(
    container: HTMLElement,
    labelLayer: HTMLElement,
    projects: PortalProject[],
    callbacks: SceneCallbacks,
  ) {
    this.container = container;
    this.labelLayer = labelLayer;
    this.projects = projects;
    this.callbacks = callbacks;
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(INK.getHex(), 0.012);

    this.camera = new THREE.PerspectiveCamera(
      55,
      container.clientWidth / container.clientHeight,
      0.1,
      200,
    );
    this.camera.position.copy(this.camPos);

    this.scene.add(new THREE.AmbientLight(0x5a6472, 0.6));
    const sun = new THREE.PointLight(0xfff1d0, 900, 160, 2);
    sun.position.set(-14, 10, 10);
    this.scene.add(sun);
    const fill = new THREE.PointLight(ACCENT.getHex(), 120, 80, 2);
    fill.position.set(10, -6, 8);
    this.scene.add(fill);

    this.buildGalaxy();
    this.buildStarfields();
    this.buildNebulae();
    this.buildPlanets();
    this.buildAstronaut();
    this.buildAlien();

    window.addEventListener("resize", this.onResize);
    container.addEventListener("pointermove", this.onPointerMove);
    container.addEventListener("pointerdown", this.onPointerDown);
    window.addEventListener("pointerup", this.onPointerUp);
    container.addEventListener("pointerleave", this.onPointerLeave);
    container.addEventListener("click", this.onClick);
    window.addEventListener("keydown", this.onKey);
    document.addEventListener("visibilitychange", this.onVisibility);

    this.renderer.setAnimationLoop(this.tick);
  }

  private buildGalaxy() {
    const count = 6000;
    const arms = 4;
    const radius = 16;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const inner = ACCENT.clone();
    const outer = new THREE.Color("#5a7bff");

    for (let i = 0; i < count; i++) {
      const r = Math.pow(Math.random(), 0.6) * radius;
      const arm = (i % arms) / arms;
      const branch = arm * Math.PI * 2 + r * 0.32;
      const spread = (Math.random() - 0.5) * 0.6 * (1 + r * 0.12);
      positions[i * 3] = Math.cos(branch) * r + spread;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.6 + spread * 0.3;
      positions[i * 3 + 2] = Math.sin(branch) * r + spread;
      const c = inner.clone().lerp(outer, Math.min(1, r / radius));
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.09,
      map: radialTexture("rgba(255,255,255,0.9)"),
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    this.galaxy = new THREE.Points(geo, mat);
    this.galaxy.position.set(-6, 3, -40);
    this.galaxy.rotation.set(-0.9, 0.4, 0.2);
    this.scene.add(this.galaxy);
  }

  private buildStarfields() {
    const make = (count: number, spread: number, size: number, opacity: number) => {
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * spread;
        positions[i * 3 + 1] = (Math.random() - 0.5) * spread;
        positions[i * 3 + 2] = (Math.random() - 0.5) * spread - 10;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.PointsMaterial({
        color: 0xffffff,
        size,
        map: radialTexture("rgba(255,255,255,1)"),
        transparent: true,
        opacity,
        depthWrite: false,
        sizeAttenuation: true,
      });
      const pts = new THREE.Points(geo, mat);
      this.scene.add(pts);
      this.starfields.push(pts);
    };
    make(1400, 120, 0.13, 0.85);
    make(2600, 180, 0.08, 0.5);
  }

  private buildNebulae() {
    const defs: Array<[string, number, [number, number, number]]> = [
      ["rgba(198,242,78,0.16)", 28, [-14, 6, -28]],
      ["rgba(90,123,255,0.16)", 32, [16, -8, -32]],
      ["rgba(180,90,255,0.12)", 24, [6, 12, -24]],
    ];
    for (const [color, scale, pos] of defs) {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: radialTexture(color),
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      );
      sprite.scale.setScalar(scale);
      sprite.position.set(pos[0], pos[1], pos[2]);
      this.scene.add(sprite);
      this.nebulae.push(sprite);
    }
  }

  private buildPlanets() {
    const n = this.projects.length;
    this.projects.forEach((project, i) => {
      const group = new THREE.Group();
      const color = tinted(clusterHue[project.cluster], 0.08);

      const planet = new THREE.Mesh(
        new THREE.SphereGeometry(PLANET_RADIUS, 48, 48),
        new THREE.MeshStandardMaterial({
          color,
          roughness: 0.6,
          metalness: 0.15,
          emissive: color.clone().multiplyScalar(0.25),
        }),
      );
      planet.userData.index = i;
      group.add(planet);

      const atmosphere = new THREE.Mesh(
        new THREE.SphereGeometry(PLANET_RADIUS * 1.12, 48, 48),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.12,
          side: THREE.BackSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      group.add(atmosphere);

      if (i % 3 === 2) {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(PLANET_RADIUS * 1.5, PLANET_RADIUS * 2.2, 64),
          new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.35,
            side: THREE.DoubleSide,
            depthWrite: false,
          }),
        );
        ring.rotation.x = Math.PI / 2.4;
        ring.rotation.y = 0.3;
        group.add(ring);
      }

      const halo = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: radialTexture(`#${color.getHexString()}`),
          transparent: true,
          opacity: 0.12,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      );
      halo.scale.setScalar(3.4);
      group.add(halo);
      this.planetHalos.push(halo);

      group.userData.angle = (i / n) * Math.PI * 2 - Math.PI / 2;
      group.userData.radius = 6.0 + (i % 3) * 1.1;
      group.userData.yOffset = (i / (n - 1) - 0.5) * 5.4;
      group.userData.bob = Math.random() * Math.PI * 2;
      this.positionPlanet(group, 0);

      this.scene.add(group);
      this.planetGroups.push(group);
      this.planets.push(planet);

      const label = document.createElement("button");
      label.type = "button";
      label.className = "portal-label";
      label.innerHTML = `<span class="portal-label__title">${project.title}</span><span class="portal-label__tag">${project.tagline}</span>`;
      label.addEventListener("click", (e) => {
        e.stopPropagation();
        this.callbacks.onSelect(i);
      });
      label.addEventListener("pointerenter", () => this.setHover(i));
      label.addEventListener("pointerleave", () => this.setHover(null));
      this.labelLayer.appendChild(label);
      this.labels.push(label);
    });
  }

  private positionPlanet(group: THREE.Group, t: number) {
    const angle = (group.userData.angle as number) + (this.reducedMotion ? 0 : t * 0.04);
    const radius = group.userData.radius as number;
    const bob = this.reducedMotion
      ? 0
      : Math.sin(t * 0.45 + (group.userData.bob as number)) * 0.4;
    group.position.set(
      Math.cos(angle) * radius,
      (group.userData.yOffset as number) + bob,
      Math.sin(angle) * 2.4 - 1,
    );
  }

  private buildAstronaut() {
    const a = new THREE.Group();
    const suit = new THREE.MeshStandardMaterial({
      color: 0xeef1f4,
      roughness: 0.55,
      metalness: 0.1,
      flatShading: true,
    });
    const dark = new THREE.MeshStandardMaterial({ color: 0x14161b, roughness: 0.4, metalness: 0.3 });
    const accentMat = new THREE.MeshStandardMaterial({
      color: ACCENT.getHex(),
      emissive: ACCENT.getHex(),
      emissiveIntensity: 0.5,
      roughness: 0.4,
    });

    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.42, 6, 12), suit);
    a.add(torso);
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.28), dark);
    pack.position.set(0, 0.02, -0.34);
    a.add(pack);

    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 24), suit);
    helmet.position.set(0, 0.62, 0);
    a.add(helmet);
    const visor = new THREE.Mesh(new THREE.SphereGeometry(0.26, 24, 24), dark);
    visor.position.set(0, 0.62, 0.12);
    visor.scale.set(1, 0.8, 0.7);
    a.add(visor);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.025, 10, 28), accentMat);
    rim.position.set(0, 0.62, 0.18);
    rim.scale.set(1, 0.9, 1);
    a.add(rim);

    const limbGeo = new THREE.CapsuleGeometry(0.12, 0.46, 5, 10);
    const mkLimb = (x: number, y: number, z: number, rz: number, rx: number) => {
      const limb = new THREE.Mesh(limbGeo, suit);
      limb.position.set(x, y, z);
      limb.rotation.z = rz;
      limb.rotation.x = rx;
      a.add(limb);
    };
    // Neutral standing pose (arms down at the sides); the zero-g "drift" look
    // comes from the whole-body tumble applied in system mode.
    mkLimb(-0.42, -0.02, 0.02, 0.28, 0.05);
    mkLimb(0.42, -0.02, -0.02, -0.28, 0.05);
    mkLimb(-0.17, -0.78, 0.02, 0.06, 0.02);
    mkLimb(0.17, -0.8, -0.02, -0.06, 0.02);

    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.04), accentMat);
    chest.position.set(0, 0.08, 0.34);
    a.add(chest);

    a.scale.setScalar(1.15);
    a.position.set(0.4, 0.3, 4.2);
    this.astronaut = a;
    this.scene.add(a);
  }

  /** Low-poly alien guide that presents each star's project. */
  private buildAlien() {
    const a = new THREE.Group();
    const skin = new THREE.MeshStandardMaterial({
      color: 0x86d98f,
      roughness: 0.5,
      metalness: 0.05,
      emissive: 0x14361b,
      emissiveIntensity: 0.35,
      flatShading: true,
    });
    const skinHead = new THREE.MeshStandardMaterial({
      color: 0x9be0a3,
      roughness: 0.45,
      flatShading: true,
    });
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0x05060a,
      roughness: 0.2,
      metalness: 0.4,
    });
    const accentMat = new THREE.MeshStandardMaterial({
      color: ACCENT.getHex(),
      emissive: ACCENT.getHex(),
      emissiveIntensity: 0.9,
    });

    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.46, 6, 12), skin);
    a.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.4, 24, 24), skinHead);
    head.position.set(0, 0.62, 0);
    head.scale.set(1, 1.22, 0.92);
    a.add(head);

    const mkEye = (x: number) => {
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), eyeMat);
      e.position.set(x, 0.6, 0.3);
      e.scale.set(0.7, 1.25, 0.5);
      e.rotation.z = x > 0 ? -0.4 : 0.4;
      a.add(e);
    };
    mkEye(-0.15);
    mkEye(0.15);

    const mkAnt = (x: number) => {
      const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.34, 6), skinHead);
      stalk.position.set(x, 0.96, 0);
      stalk.rotation.z = x > 0 ? -0.25 : 0.25;
      a.add(stalk);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), accentMat);
      bulb.position.set(x * 1.3, 1.14, 0);
      a.add(bulb);
    };
    mkAnt(-0.12);
    mkAnt(0.12);

    const armGeo = new THREE.CapsuleGeometry(0.07, 0.4, 5, 10);
    const raised = new THREE.Mesh(armGeo, skin);
    raised.position.set(-0.34, 0.2, 0.05);
    raised.rotation.z = 1.15; // presenting, raised outward
    a.add(raised);
    const side = new THREE.Mesh(armGeo, skin);
    side.position.set(0.32, -0.02, 0);
    side.rotation.z = -0.35;
    a.add(side);

    const legGeo = new THREE.CapsuleGeometry(0.08, 0.3, 5, 10);
    const ll = new THREE.Mesh(legGeo, skin);
    ll.position.set(-0.12, -0.5, 0);
    a.add(ll);
    const rl = new THREE.Mesh(legGeo, skin);
    rl.position.set(0.12, -0.52, 0);
    a.add(rl);

    a.visible = false;
    this.alien = a;
    this.alienArm = raised;
    this.scene.add(a);
  }

  // ---- Surface ("walk on the star") mode ----

  private enterSurface(i: number) {
    this.exitSurface(); // clear any previous star
    const project = this.projects[i];
    this.mode = "surface";
    this.surfaceFacts = projectFacts(project);

    const root = new THREE.Group();
    const surfTex = makeSurfaceTexture(project);
    const planet = new THREE.Mesh(
      new THREE.SphereGeometry(SURFACE_RADIUS, 192, 192),
      new THREE.MeshStandardMaterial({
        map: surfTex,
        bumpMap: surfTex,
        bumpScale: 0.5,
        displacementMap: surfTex,
        displacementScale: 0.24,
        roughness: 0.95,
        metalness: 0.05,
        emissive: clusterColor(project).multiplyScalar(0.12),
      }),
    );
    root.add(planet);
    this.surfacePlanet = planet;

    // Atmosphere glow.
    const atmo = new THREE.Mesh(
      new THREE.SphereGeometry(SURFACE_RADIUS * 1.06, 64, 64),
      new THREE.MeshBasicMaterial({
        color: clusterColor(project),
        transparent: true,
        opacity: 0.1,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    root.add(atmo);

    // Landmarks — distributed around the globe; children of the planet so they
    // rotate together as you "walk".
    const facts = this.surfaceFacts;
    const up = new THREE.Vector3(0, 1, 0);
    facts.forEach((fact, j) => {
      const lon = (j / facts.length) * Math.PI * 2;
      const lat = j % 2 === 0 ? 0.4 : -0.2;
      const dir = new THREE.Vector3(
        Math.cos(lat) * Math.sin(lon),
        Math.sin(lat),
        Math.cos(lat) * Math.cos(lon),
      ).normalize();

      const g = new THREE.Group();
      const q = new THREE.Quaternion().setFromUnitVectors(up, dir);
      g.quaternion.copy(q);
      g.position.copy(dir.clone().multiplyScalar(SURFACE_RADIUS));

      const obelisk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.13, 0.7, 8),
        new THREE.MeshStandardMaterial({
          color: ACCENT.getHex(),
          emissive: ACCENT.getHex(),
          emissiveIntensity: 0.4,
          roughness: 0.4,
        }),
      );
      obelisk.position.y = 0.35;
      g.add(obelisk);

      const tip = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.12, 0),
        new THREE.MeshStandardMaterial({
          color: ACCENT.getHex(),
          emissive: ACCENT.getHex(),
          emissiveIntensity: 0.7,
        }),
      );
      tip.position.y = 0.8;
      g.add(tip);

      const sprite = makeLabelSprite(fact.tag);
      sprite.scale.set(1.2, 0.36, 1);
      sprite.position.y = 1.45;
      g.add(sprite);

      planet.add(g);
      this.landmarks.push({ group: g, obelisk, tip, sprite, dir });
    });

    // Rotate so the first landmark starts under the astronaut.
    if (this.landmarks.length) {
      planet.quaternion.setFromUnitVectors(this.landmarks[0].dir.clone(), up);
    }

    root.position.set(0, 0, 0);
    this.scene.add(root);
    this.surfaceRoot = root;

    // Hide the system planets/labels; bring the astronaut down to stand and
    // wake the alien guide.
    this.planetGroups.forEach((g) => (g.visible = false));
    this.astronaut.scale.setScalar(1.2);
    this.alien.visible = true;

    this.activeLandmark = null;
    this.callbacks.onSurfaceFact(null);
  }

  private exitSurface() {
    if (this.surfaceRoot) {
      this.scene.remove(this.surfaceRoot);
      this.surfaceRoot.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const mat = mesh.material as
          | (THREE.Material & { map?: THREE.Texture; bumpMap?: THREE.Texture })
          | undefined;
        if (mat) {
          mat.map?.dispose();
          mat.bumpMap?.dispose();
          mat.dispose();
        }
      });
    }
    this.surfaceRoot = null;
    this.surfacePlanet = null;
    this.landmarks = [];
    this.surfaceFacts = [];
    this.activeLandmark = null;
    this.mode = "system";
    this.astronaut.scale.setScalar(1.15);
    if (this.alien) this.alien.visible = false;
    this.planetGroups.forEach((g) => (g.visible = true));
  }

  /** Rotate the star under the astronaut to "walk". */
  private walk(dx: number, dy: number) {
    if (!this.surfacePlanet) return;
    const k = 0.005;
    const qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -dx * k);
    const qx = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -dy * k);
    this.surfacePlanet.quaternion.premultiply(qx).premultiply(qy);
  }

  private updateSurface(t: number) {
    if (!this.surfacePlanet) return;

    // Gentle idle drift until the visitor takes over.
    if (!this.dragging && !this.reducedMotion) {
      this.walk(0.16, 0);
    }

    // "Reach" point is in FRONT of and below the astronaut (down the near
    // slope) so the active landmark sits ahead of the figure, never inside it.
    const reach = new THREE.Vector3(0, 1, 0.55).normalize();
    let best = -1;
    let bestDot = -1;
    const wp = new THREE.Vector3();
    this.landmarks.forEach((lm, j) => {
      lm.group.getWorldPosition(wp);
      const dot = wp.clone().normalize().dot(reach);
      if (dot > bestDot) {
        bestDot = dot;
        best = j;
      }
      lm.tip.rotation.y += 0.03;
    });
    const active = bestDot > ACTIVE_DOT ? best : null;

    this.landmarks.forEach((lm, j) => {
      const on = j === active;
      const mat = lm.obelisk.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity += ((on ? 1.1 : 0.4) - mat.emissiveIntensity) * 0.15;
      const s = lm.sprite.scale.x + ((on ? 1.65 : 1.2) - lm.sprite.scale.x) * 0.15;
      lm.sprite.scale.set(s, s * 0.3, 1);
      const sm = lm.sprite.material as THREE.SpriteMaterial;
      sm.opacity += ((on ? 1 : 0.55) - sm.opacity) * 0.12;
    });

    if (active !== this.activeLandmark) {
      this.activeLandmark = active;
      this.callbacks.onSurfaceFact(active === null ? null : this.surfaceFacts[active]);
    }

    const up = new THREE.Vector3(0, 1, 0);

    // Astronaut (the visitor) stands planted at the top, facing the camera.
    const standY = SURFACE_RADIUS + 0.95;
    this.astronaut.position.set(
      0,
      standY + (this.reducedMotion ? 0 : Math.sin(t * 1.6) * 0.03),
      0,
    );
    this.astronaut.rotation.set(0, Math.sin(t * 0.3) * 0.2, 0);
    this.astronaut.visible = true;

    // Alien guide stands on the near slope, presenting toward the visitor.
    const adir = new THREE.Vector3(0.5, 1, 0.32).normalize();
    this.alien.position.copy(adir.clone().multiplyScalar(SURFACE_RADIUS + 0.62));
    this.alien.quaternion.setFromUnitVectors(up, adir);
    this.alien.rotateY(-0.9 + (this.reducedMotion ? 0 : Math.sin(t * 0.5) * 0.08));
    if (!this.reducedMotion) {
      this.alienArm.rotation.z = 1.15 + Math.sin(t * 2) * 0.14;
      this.alien.position.y += Math.sin(t * 1.4) * 0.03;
    }
    this.alien.visible = true;
  }

  private tick = () => {
    if (!this.running) return;
    const t = this.clock.getElapsedTime();
    this.frame++;

    if (!this.reducedMotion) {
      this.galaxy.rotation.z = t * 0.015;
      this.starfields[0].rotation.y = t * 0.006;
      this.starfields[1].rotation.y = -t * 0.003;
    }

    const desiredPos = new THREE.Vector3();
    const desiredLook = new THREE.Vector3();

    if (this.mode === "surface") {
      this.updateSurface(t);
      desiredPos.set(0, SURFACE_RADIUS + 2.4, 7.2);
      desiredLook.set(0, SURFACE_RADIUS + 0.15, 0);
    } else {
      this.planetGroups.forEach((group, i) => {
        this.positionPlanet(group, t);
        if (!this.reducedMotion) this.planets[i].rotation.y += 0.004;
        const isHover = this.hovered === i;
        const halo = this.planetHalos[i];
        const haloTarget = isHover ? 0.5 : 0.12;
        halo.material.opacity += (haloTarget - halo.material.opacity) * 0.12;
        const scaleTarget = isHover ? 1.18 : 1;
        const s = group.scale.x + (scaleTarget - group.scale.x) * 0.12;
        group.scale.setScalar(s);
      });

      if (this.astronaut && !this.reducedMotion) {
        this.astronaut.rotation.y = Math.sin(t * 0.18) * 0.6 + t * 0.05;
        this.astronaut.rotation.x = Math.sin(t * 0.13) * 0.18;
        this.astronaut.rotation.z = Math.cos(t * 0.11) * 0.12;
        this.astronaut.position.x = 0.4 + Math.sin(t * 0.16) * 0.7;
        this.astronaut.position.y = 0.3 + Math.cos(t * 0.21) * 0.5;
        this.astronaut.position.z = 4.2 + Math.sin(t * 0.1) * 0.5;
      }

      this.parallax.x += (this.parallaxTarget.x - this.parallax.x) * 0.04;
      this.parallax.y += (this.parallaxTarget.y - this.parallax.y) * 0.04;
      desiredPos.set(this.parallax.x * 2.2, 0.8 + this.parallax.y * 1.4, 13);
      desiredLook.set(0, 0, 0);
    }

    this.camPos.lerp(desiredPos, 0.06);
    this.camLookAt.lerp(desiredLook, 0.06);
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camLookAt);

    this.updateHover();
    this.updateLabels();

    this.renderer.render(this.scene, this.camera);
  };

  private updateHover() {
    if (this.mode === "surface") return;
    if (this.frame % 4 !== 0) return;
    if (this.pointer.x < -1) return;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.planets, false);
    const idx = hits.length ? (hits[0].object.userData.index as number) : null;
    if (idx !== this.hovered) this.setHover(idx);
  }

  private setHover(idx: number | null) {
    if (this.mode === "surface") idx = null;
    this.hovered = idx;
    this.container.style.cursor = idx === null ? "" : "pointer";
    this.labels.forEach((l, i) => l.classList.toggle("is-hover", i === idx));
    this.callbacks.onHover(idx);
  }

  private updateLabels() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.planetGroups.forEach((group, i) => {
      const label = this.labels[i];
      if (this.mode === "surface") {
        label.style.opacity = "0";
        label.style.pointerEvents = "none";
        return;
      }
      label.style.pointerEvents = "auto";
      const v = group.position.clone().project(this.camera);
      if (v.z > 1) {
        label.style.opacity = "0";
        return;
      }
      const x = (v.x * 0.5 + 0.5) * w;
      const y = (-v.y * 0.5 + 0.5) * h;
      label.style.transform = `translate(-50%, -50%) translate(${x}px, ${y + 58}px)`;
      label.style.opacity = "1";
    });
  }

  /** Called by React: enter surface mode for a star, or leave it. */
  focus(idx: number | null) {
    if (idx === null) {
      if (this.mode === "surface") this.exitSurface();
      return;
    }
    this.enterSurface(idx);
  }

  private onPointerMove = (e: PointerEvent) => {
    const rect = this.container.getBoundingClientRect();
    if (this.mode === "surface") {
      if (this.dragging) {
        this.walk(e.clientX - this.lastPointer.x, e.clientY - this.lastPointer.y);
        this.lastPointer.set(e.clientX, e.clientY);
      }
      return;
    }
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    this.pointer.set(nx * 2 - 1, -(ny * 2 - 1));
    this.parallaxTarget.set(nx * 2 - 1, -(ny * 2 - 1));
  };

  private onPointerDown = (e: PointerEvent) => {
    if (this.mode !== "surface") return;
    this.dragging = true;
    this.lastPointer.set(e.clientX, e.clientY);
    this.container.style.cursor = "grabbing";
  };

  private onPointerUp = () => {
    if (this.dragging) {
      this.dragging = false;
      this.container.style.cursor = this.mode === "surface" ? "grab" : "";
    }
  };

  private onPointerLeave = () => {
    this.pointer.set(-2, -2);
    this.parallaxTarget.set(0, 0);
    if (this.mode === "system") this.setHover(null);
  };

  private onClick = () => {
    if (this.mode === "surface") return;
    if (this.hovered !== null) this.callbacks.onSelect(this.hovered);
  };

  private onKey = (e: KeyboardEvent) => {
    if (this.mode !== "surface") return;
    const step = 26;
    if (e.key === "ArrowLeft" || e.key === "a") this.walk(-step, 0);
    else if (e.key === "ArrowRight" || e.key === "d") this.walk(step, 0);
    else if (e.key === "ArrowUp" || e.key === "w") this.walk(0, -step);
    else if (e.key === "ArrowDown" || e.key === "s") this.walk(0, step);
  };

  private onResize = () => {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private onVisibility = () => {
    if (document.hidden) this.clock.stop();
    else this.clock.start();
  };

  dispose() {
    this.running = false;
    this.renderer.setAnimationLoop(null);
    this.exitSurface();
    window.removeEventListener("resize", this.onResize);
    this.container.removeEventListener("pointermove", this.onPointerMove);
    this.container.removeEventListener("pointerdown", this.onPointerDown);
    window.removeEventListener("pointerup", this.onPointerUp);
    this.container.removeEventListener("pointerleave", this.onPointerLeave);
    this.container.removeEventListener("click", this.onClick);
    window.removeEventListener("keydown", this.onKey);
    document.removeEventListener("visibilitychange", this.onVisibility);
    this.labels.forEach((l) => l.remove());
    this.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const mat = mesh.material as
        | (THREE.Material & { map?: THREE.Texture })
        | THREE.Material[]
        | undefined;
      const disposeMat = (m: THREE.Material & { map?: THREE.Texture }) => {
        if (m.map) m.map.dispose();
        m.dispose();
      };
      if (Array.isArray(mat)) mat.forEach(disposeMat);
      else if (mat) disposeMat(mat);
    });
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
