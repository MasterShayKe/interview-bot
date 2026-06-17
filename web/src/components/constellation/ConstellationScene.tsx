import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame, useThree, type ThreeElements } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

// @types/three r0.169 + R3F v8 collapse Material instance props to `{}` for the
// JSX material elements (geometry/mesh elements are unaffected). These params
// are all valid three.js material options at runtime; we type them explicitly
// via R3F's own element prop types so we keep type-checking without `any`.
type BasicMatProps = ThreeElements["meshBasicMaterial"];
type StandardMatProps = ThreeElements["meshStandardMaterial"];
type LineMatProps = ThreeElements["lineBasicMaterial"];
import type { Project } from "../../lib/api.js";
import {
  constellationEdges,
  layoutConstellation,
  type ConstellationNode,
} from "../../lib/constellation.js";

interface Props {
  projects: Project[];
  /** Project id the guide asked to focus — flies the camera + pulses it. */
  focusedId: string | null;
  onSelect: (p: Project) => void;
  reducedMotion: boolean;
}

/**
 * The R3F scene. Default-exported and lazy-loaded by ProjectConstellation so
 * three.js never enters the main bundle and a load/runtime failure can be
 * caught by the surrounding error boundary.
 */
export default function ConstellationScene({
  projects,
  focusedId,
  onSelect,
  reducedMotion,
}: Props) {
  const nodes = useMemo(() => layoutConstellation(projects), [projects]);
  const edges = useMemo(() => constellationEdges(nodes), [nodes]);

  return (
    <Canvas
      camera={{ position: [0, 0, 11], fov: 50 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ width: "100%", height: "100%" }}
    >
      <color attach="background" args={["#0a0810"]} />
      <fog attach="fog" args={["#0a0810", 12, 26]} />
      <ambientLight intensity={0.6} />
      <pointLight position={[6, 8, 10]} intensity={40} color="#c4b5fd" />
      <pointLight position={[-8, -4, 6]} intensity={22} color="#8b5cf6" />

      <PointerParallax focused={focusedId !== null} reducedMotion={reducedMotion}>
        <Edges nodes={nodes} edges={edges} />

        {nodes.map((node) => (
          <Node
            key={node.project.id}
            node={node}
            focused={node.project.id === focusedId}
            reducedMotion={reducedMotion}
            onSelect={onSelect}
          />
        ))}
      </PointerParallax>

      <CameraRig nodes={nodes} focusedId={focusedId} />

      <OrbitControls
        enablePan={false}
        enableZoom={false}
        autoRotate={false}
        rotateSpeed={0.7}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={(2 * Math.PI) / 3}
        makeDefault
      />
    </Canvas>
  );
}

/**
 * Tips the whole constellation toward the cursor — move the mouse and the graph
 * leans that way (pointer parallax), so direction is driven by cursor position
 * rather than a constant auto-spin. Pauses while the user is actively dragging
 * the orbit, and eases back to neutral when a node is focused so the camera
 * fly-to lines up with the static layout. Disabled for reduced motion.
 */
function PointerParallax({
  children,
  focused,
  reducedMotion,
}: {
  children: ReactNode;
  focused: boolean;
  reducedMotion: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const dragging = useRef(false);
  // The canvas DOM element is always present; we watch its pointer events
  // directly rather than the OrbitControls instance (which may be null on the
  // first frames and whose event wiring proved brittle).
  const domElement = useThree((s) => s.gl.domElement);

  useEffect(() => {
    if (!domElement) return;
    const onDown = () => (dragging.current = true);
    const onUp = () => (dragging.current = false);
    domElement.addEventListener("pointerdown", onDown);
    // Listen for release on the window so a drag that ends off-canvas still clears.
    window.addEventListener("pointerup", onUp);
    return () => {
      domElement.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    };
  }, [domElement]);

  useFrame((state, delta) => {
    const g = groupRef.current;
    if (!g) return;
    let targetY = 0;
    let targetX = 0;
    if (!reducedMotion && !focused && !dragging.current) {
      // Always-on ambient sway keeps the scene alive when the cursor is still;
      // the cursor (pointer.x/y, normalized -1..1) biases the lean on top of it.
      // Bounded oscillation (not an unbounded spin) keeps focus/drag transitions
      // smooth. Slightly out-of-phase periods make the drift feel organic.
      const t = state.clock.elapsedTime;
      targetY = Math.sin(t * 0.13) * 0.45 + state.pointer.x * 0.5;
      targetX = Math.sin(t * 0.19) * 0.09 - state.pointer.y * 0.3;
    }
    // Frame-rate-independent easing toward the cursor-driven target.
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, targetY, 3.5, delta);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, targetX, 3.5, delta);
  });

  return <group ref={groupRef}>{children}</group>;
}

function Node({
  node,
  focused,
  reducedMotion,
  onSelect,
}: {
  node: ConstellationNode;
  focused: boolean;
  reducedMotion: boolean;
  onSelect: (p: Project) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const color = useMemo(() => new THREE.Color(node.color), [node.color]);

  useFrame((state) => {
    const mesh = meshRef.current;
    const halo = haloRef.current;
    if (!mesh) return;
    const t = state.clock.elapsedTime;
    // Target scale: hover/focus enlarge; focus also pulses.
    const focusPulse = focused && !reducedMotion ? 0.18 * Math.sin(t * 3) : 0;
    const target = (hovered ? 1.5 : 1) + (focused ? 0.55 : 0) + focusPulse;
    mesh.scale.lerp(new THREE.Vector3(target, target, target), 0.18);
    if (halo) {
      const ht = target * 1.85;
      halo.scale.lerp(new THREE.Vector3(ht, ht, ht), 0.18);
      const mat = halo.material as THREE.MeshBasicMaterial;
      mat.opacity = THREE.MathUtils.lerp(
        mat.opacity,
        hovered || focused ? 0.28 : 0.12,
        0.15,
      );
    }
  });

  const showLabel = hovered || focused;

  return (
    <group position={node.position}>
      {/* Soft glow halo */}
      <mesh ref={haloRef}>
        <sphereGeometry args={[0.34, 24, 24]} />
        <meshBasicMaterial
          {...({
            color,
            transparent: true,
            opacity: 0.12,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          } as unknown as BasicMatProps)}
        />
      </mesh>
      {/* Core node */}
      <mesh
        ref={meshRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "";
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(node.project);
        }}
      >
        <sphereGeometry args={[0.26, 32, 32]} />
        <meshStandardMaterial
          {...({
            color,
            emissive: color,
            emissiveIntensity: focused ? 1.4 : 0.7,
            roughness: 0.35,
            metalness: 0.1,
          } as unknown as StandardMatProps)}
        />
      </mesh>

      {showLabel && (
        <Html
          center
          distanceFactor={9}
          position={[0, 0.7, 0]}
          style={{ pointerEvents: "none" }}
          zIndexRange={[20, 0]}
        >
          <div
            style={{
              whiteSpace: "nowrap",
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: "0.7rem",
              fontWeight: 600,
              letterSpacing: "0.04em",
              color: "#fdfcff",
              padding: "4px 10px",
              borderRadius: "8px",
              background: "rgba(14,10,22,0.78)",
              border: `1px solid ${node.color}66`,
              boxShadow: `0 6px 24px -8px ${node.color}99`,
              backdropFilter: "blur(6px)",
            }}
          >
            {node.project.name}
          </div>
        </Html>
      )}
    </group>
  );
}

function Edges({
  nodes,
  edges,
}: {
  nodes: ConstellationNode[];
  edges: [number, number][];
}) {
  const geometry = useMemo(() => {
    const positions: number[] = [];
    for (const [a, b] of edges) {
      positions.push(...nodes[a].position, ...nodes[b].position);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    return geo;
  }, [nodes, edges]);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial
        {...({
          color: "#a855f7",
          transparent: true,
          opacity: 0.16,
          depthWrite: false,
        } as unknown as LineMatProps)}
      />
    </lineSegments>
  );
}

/**
 * Lerps the OrbitControls target + camera toward a focused node so the
 * guide's focusProject tool "flies" the view to it, then releases.
 */
function CameraRig({
  nodes,
  focusedId,
}: {
  nodes: ConstellationNode[];
  focusedId: string | null;
}) {
  const { controls } = useThree() as unknown as {
    controls: { target: THREE.Vector3; update: () => void } | null;
  };
  const target = useRef(new THREE.Vector3(0, 0, 0));
  const active = useRef(false);

  useEffect(() => {
    const node = focusedId
      ? nodes.find((n) => n.project.id === focusedId)
      : null;
    if (node) {
      target.current.set(...node.position);
      active.current = true;
    } else {
      target.current.set(0, 0, 0);
      // Let auto-rotate take back over after re-centering.
      active.current = false;
    }
  }, [focusedId, nodes]);

  useFrame(() => {
    if (!controls) return;
    // Always gently ease the orbit target toward the focus point (origin when
    // unfocused) so the fly-to feels intentional but never fights the user.
    controls.target.lerp(target.current, active.current ? 0.06 : 0.03);
    controls.update();
  });

  return null;
}
