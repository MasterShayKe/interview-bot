import * as THREE from "three";
import type { PortalProject } from "./projects.js";

// Palette pulled from the app's design tokens (index.css / tailwind.config.js).
const ACCENT = new THREE.Color("#c6f24e");
const INK = new THREE.Color("#0a0b0d");

interface SceneCallbacks {
  onHover: (index: number | null) => void;
  onSelect: (index: number) => void;
}

/** Tint the lime accent by a hue offset so each planet reads distinctly. */
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
  const g = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
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
  private planets: THREE.Mesh[] = []; // raycast targets (one per project)
  private planetGroups: THREE.Group[] = [];
  private planetHalos: THREE.Sprite[] = [];
  private astronaut!: THREE.Group;
  private labels: HTMLElement[] = [];

  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2(-2, -2);
  private parallax = new THREE.Vector2(0, 0);
  private parallaxTarget = new THREE.Vector2(0, 0);
  private hovered: number | null = null;
  private active: number | null = null;
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
    this.reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(INK.getHex(), 0.014);

    this.camera = new THREE.PerspectiveCamera(
      55,
      container.clientWidth / container.clientHeight,
      0.1,
      200,
    );
    this.camera.position.set(0, 0.8, 13);

    // Lighting: a warm "sun" key, cool fill, low ambient.
    this.scene.add(new THREE.AmbientLight(0x5a6472, 0.6));
    const sun = new THREE.PointLight(0xfff1d0, 900, 120, 2);
    sun.position.set(-14, 10, 8);
    this.scene.add(sun);
    const fill = new THREE.PointLight(ACCENT.getHex(), 120, 60, 2);
    fill.position.set(10, -6, 6);
    this.scene.add(fill);

    this.buildGalaxy();
    this.buildStarfields();
    this.buildNebulae();
    this.buildPlanets();
    this.buildAstronaut();

    window.addEventListener("resize", this.onResize);
    container.addEventListener("pointermove", this.onPointerMove);
    container.addEventListener("pointerleave", this.onPointerLeave);
    container.addEventListener("click", this.onClick);
    document.addEventListener("visibilitychange", this.onVisibility);

    this.renderer.setAnimationLoop(this.tick);
  }

  /** A spiral galaxy of colored points, tilted and drifting in the deep field. */
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
      const spin = r * 0.32;
      const branch = arm * Math.PI * 2 + spin;
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
    this.galaxy.position.set(-6, 3, -34);
    this.galaxy.rotation.set(-0.9, 0.4, 0.2);
    this.scene.add(this.galaxy);
  }

  /** Two parallax star layers. */
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
    make(1200, 90, 0.13, 0.85); // near
    make(2200, 150, 0.08, 0.5); // far
  }

  /** Large additive color clouds for depth. */
  private buildNebulae() {
    const defs: Array<[string, number, [number, number, number], number]> = [
      ["rgba(198,242,78,0.16)", 26, [-12, 6, -26], 0],
      ["rgba(90,123,255,0.16)", 30, [14, -8, -30], 0],
      ["rgba(180,90,255,0.12)", 22, [6, 10, -22], 0],
    ];
    for (const [color, scale, pos] of defs) {
      const mat = new THREE.SpriteMaterial({
        map: radialTexture(color),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.setScalar(scale);
      sprite.position.set(pos[0], pos[1], pos[2]);
      this.scene.add(sprite);
      this.nebulae.push(sprite);
    }
  }

  /** One planet per project, orbiting the scene; the clickable target. */
  private buildPlanets() {
    const n = this.projects.length;
    this.projects.forEach((project, i) => {
      const group = new THREE.Group();
      const color = tinted(project.hue, 0.08);

      const planet = new THREE.Mesh(
        new THREE.SphereGeometry(0.95, 48, 48),
        new THREE.MeshStandardMaterial({
          color,
          roughness: 0.65,
          metalness: 0.15,
          emissive: color.clone().multiplyScalar(0.25),
          flatShading: false,
        }),
      );
      planet.userData.index = i;
      group.add(planet);

      // Thin atmosphere rim.
      const atmosphere = new THREE.Mesh(
        new THREE.SphereGeometry(1.06, 48, 48),
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

      // Every other planet gets a ring system.
      if (i % 2 === 1) {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(1.4, 2.1, 64),
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

      // Hover/active halo (billboarded sprite).
      const halo = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: radialTexture(`#${color.getHexString()}`),
          transparent: true,
          opacity: 0,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      );
      halo.scale.setScalar(4);
      group.add(halo);
      this.planetHalos.push(halo);

      // Spread planets around a wide orbit at varied heights/depths.
      const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
      group.userData.angle = angle;
      group.userData.radius = 6.5;
      group.userData.yOffset = (i - (n - 1) / 2) * 1.4;
      group.userData.bob = Math.random() * Math.PI * 2;
      this.positionPlanet(group, 0);

      this.scene.add(group);
      this.planetGroups.push(group);
      this.planets.push(planet);

      // HTML label.
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
    const angle =
      (group.userData.angle as number) + (this.reducedMotion ? 0 : t * 0.045);
    const radius = group.userData.radius as number;
    const bob = this.reducedMotion
      ? 0
      : Math.sin(t * 0.5 + (group.userData.bob as number)) * 0.4;
    group.position.set(
      Math.cos(angle) * radius,
      (group.userData.yOffset as number) + bob,
      Math.sin(angle) * 2.2 - 1,
    );
  }

  /** Low-poly astronaut assembled from primitives. */
  private buildAstronaut() {
    const a = new THREE.Group();
    const suit = new THREE.MeshStandardMaterial({
      color: 0xeef1f4,
      roughness: 0.55,
      metalness: 0.1,
      flatShading: true,
    });
    const dark = new THREE.MeshStandardMaterial({
      color: 0x14161b,
      roughness: 0.4,
      metalness: 0.3,
    });
    const accentMat = new THREE.MeshStandardMaterial({
      color: ACCENT.getHex(),
      emissive: ACCENT.getHex(),
      emissiveIntensity: 0.5,
      roughness: 0.4,
    });

    // Torso + backpack.
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.42, 6, 12), suit);
    a.add(torso);
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.28), dark);
    pack.position.set(0, 0.02, -0.34);
    a.add(pack);

    // Helmet + dark visor + accent rim.
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

    // Limbs.
    const limbGeo = new THREE.CapsuleGeometry(0.12, 0.46, 5, 10);
    const mkLimb = (x: number, y: number, z: number, rz: number, rx: number) => {
      const limb = new THREE.Mesh(limbGeo, suit);
      limb.position.set(x, y, z);
      limb.rotation.z = rz;
      limb.rotation.x = rx;
      a.add(limb);
    };
    mkLimb(-0.5, 0.12, 0.05, 0.7, 0.3); // left arm out
    mkLimb(0.5, 0.05, -0.05, -0.5, -0.4); // right arm
    mkLimb(-0.2, -0.7, 0.05, 0.18, 0.25); // left leg
    mkLimb(0.22, -0.72, -0.05, -0.12, -0.2); // right leg

    // Chest accent light.
    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.04), accentMat);
    chest.position.set(0, 0.08, 0.34);
    a.add(chest);

    a.scale.setScalar(1.25);
    a.position.set(0.4, 0.3, 4.2);
    this.astronaut = a;
    this.scene.add(a);
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

    // Planets orbit, spin, and pulse their halo on focus.
    this.planetGroups.forEach((group, i) => {
      this.positionPlanet(group, t);
      if (!this.reducedMotion) this.planets[i].rotation.y += 0.004;
      const isFocus = this.hovered === i || this.active === i;
      const halo = this.planetHalos[i];
      const target = isFocus ? 0.5 : 0.12;
      halo.material.opacity += (target - halo.material.opacity) * 0.12;
      const targetScale = isFocus ? 1.18 : 1;
      const s = group.scale.x + (targetScale - group.scale.x) * 0.12;
      group.scale.setScalar(s);
    });

    // Astronaut tumbles and drifts gently in zero-g.
    if (this.astronaut && !this.reducedMotion) {
      this.astronaut.rotation.y = Math.sin(t * 0.18) * 0.6 + t * 0.05;
      this.astronaut.rotation.x = Math.sin(t * 0.13) * 0.18;
      this.astronaut.rotation.z = Math.cos(t * 0.11) * 0.12;
      this.astronaut.position.x = 0.4 + Math.sin(t * 0.16) * 0.7;
      this.astronaut.position.y = 0.3 + Math.cos(t * 0.21) * 0.5;
      this.astronaut.position.z = 4.2 + Math.sin(t * 0.1) * 0.5;
    }

    // Pointer parallax.
    this.parallax.x += (this.parallaxTarget.x - this.parallax.x) * 0.04;
    this.parallax.y += (this.parallaxTarget.y - this.parallax.y) * 0.04;
    this.camera.position.x = this.parallax.x * 2.2;
    this.camera.position.y = 0.8 + this.parallax.y * 1.4;
    this.camera.lookAt(0, 0, 0);

    this.updateHover();
    this.updateLabels();

    this.renderer.render(this.scene, this.camera);
  };

  private updateHover() {
    if (this.frame % 4 !== 0) return;
    if (this.pointer.x < -1) return;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.planets, false);
    const idx = hits.length ? (hits[0].object.userData.index as number) : null;
    if (idx !== this.hovered) this.setHover(idx);
  }

  private setHover(idx: number | null) {
    this.hovered = idx;
    this.container.style.cursor = idx === null ? "" : "pointer";
    this.labels.forEach((l, i) => l.classList.toggle("is-hover", i === idx));
    this.callbacks.onHover(idx);
  }

  /** Project each planet to screen space and place its HTML label. */
  private updateLabels() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.planetGroups.forEach((group, i) => {
      const v = group.position.clone().project(this.camera);
      const label = this.labels[i];
      if (v.z > 1) {
        label.style.opacity = "0";
        return;
      }
      const x = (v.x * 0.5 + 0.5) * w;
      const y = (-v.y * 0.5 + 0.5) * h;
      label.style.transform = `translate(-50%, -50%) translate(${x}px, ${y + 70}px)`;
      label.style.opacity = "1";
      label.classList.toggle("is-active", this.active === i);
    });
  }

  setActive(idx: number | null) {
    this.active = idx;
  }

  private onPointerMove = (e: PointerEvent) => {
    const rect = this.container.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    this.pointer.set(nx * 2 - 1, -(ny * 2 - 1));
    this.parallaxTarget.set(nx * 2 - 1, -(ny * 2 - 1));
  };

  private onPointerLeave = () => {
    this.pointer.set(-2, -2);
    this.parallaxTarget.set(0, 0);
    this.setHover(null);
  };

  private onClick = () => {
    if (this.hovered !== null) this.callbacks.onSelect(this.hovered);
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
    window.removeEventListener("resize", this.onResize);
    this.container.removeEventListener("pointermove", this.onPointerMove);
    this.container.removeEventListener("pointerleave", this.onPointerLeave);
    this.container.removeEventListener("click", this.onClick);
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
