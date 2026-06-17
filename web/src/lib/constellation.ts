import type { Cluster, Project } from "./api.js";

/** Cluster → hex color, mirrors the Tailwind `cluster` palette for Three.js. */
export const CLUSTER_HEX: Record<Cluster, string> = {
  ai: "#8b5cf6",
  trading: "#34d399",
  community: "#ec4899",
  web: "#fbbf24",
};

export interface ConstellationNode {
  project: Project;
  /** World-space position [x, y, z]. */
  position: [number, number, number];
  color: string;
}

/**
 * Lays the projects out as a sculptural node-graph in depth — NOT a starfield.
 * Projects are grouped by cluster; each cluster occupies a sector of the XY
 * plane, and nodes are pushed to varied depths (z) so the graph reads as a
 * dimensional structure rather than scattered points. Deterministic: the same
 * project list always yields the same arrangement.
 */
export function layoutConstellation(projects: Project[]): ConstellationNode[] {
  const clusters = ["ai", "trading", "community", "web"] as const;
  const byCluster = new Map<Cluster, Project[]>();
  for (const c of clusters) byCluster.set(c, []);
  for (const p of projects) byCluster.get(p.cluster)?.push(p);

  const nodes: ConstellationNode[] = [];
  const sectorCount = clusters.length;

  clusters.forEach((cluster, ci) => {
    const group = byCluster.get(cluster) ?? [];
    if (group.length === 0) return;
    // Anchor angle for this cluster's sector around the ring.
    const sectorAngle = (ci / sectorCount) * Math.PI * 2 - Math.PI / 2;

    group.forEach((project, gi) => {
      // Spread members of a cluster along a short arc + depth ramp.
      const spread = (gi - (group.length - 1) / 2) * 0.42;
      const angle = sectorAngle + spread;
      // Radius grows slightly with index so members don't overlap.
      const radius = 3.0 + (gi % 2) * 0.9 + (group.length > 2 ? 0.3 : 0);
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius * 0.62; // flatten vertically
      // Depth: alternate front/back, scaled by a stable hash of the id.
      const h = hash(project.id);
      const z = ((h % 7) - 3) * 0.9 + (gi % 2 === 0 ? 0.6 : -0.6);
      nodes.push({
        project,
        position: [x, y, z],
        color: CLUSTER_HEX[project.cluster],
      });
    });
  });

  return nodes;
}

/**
 * Connecting lines: link nodes within the same cluster (sibling systems),
 * plus a faint spine from each cluster's first node toward origin. Returns
 * index pairs into the node array.
 */
export function constellationEdges(
  nodes: ConstellationNode[],
): [number, number][] {
  const edges: [number, number][] = [];
  const byCluster = new Map<Cluster, number[]>();
  nodes.forEach((n, i) => {
    const arr = byCluster.get(n.project.cluster) ?? [];
    arr.push(i);
    byCluster.set(n.project.cluster, arr);
  });
  for (const idxs of byCluster.values()) {
    for (let i = 0; i < idxs.length - 1; i++) {
      edges.push([idxs[i], idxs[i + 1]]);
    }
  }
  return edges;
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}
