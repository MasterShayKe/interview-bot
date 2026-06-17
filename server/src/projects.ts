import fs from "node:fs";

export type Cluster = "ai" | "trading" | "community" | "web";

export interface ProjectLink {
  label: string;
  kind: "repo" | "live" | "brand" | "private";
  url?: string;
}

export interface Project {
  id: string;
  name: string;
  tagline: string;
  cluster: Cluster;
  stack: string[];
  status?: "live";
  detail: string;
  links: ProjectLink[];
}

const CLUSTERS: ReadonlySet<string> = new Set(["ai", "trading", "community", "web"]);
const LINK_KINDS: ReadonlySet<string> = new Set(["repo", "live", "brand", "private"]);

function str(v: unknown): v is string {
  return typeof v === "string" && v.length > 0;
}

function validate(p: any, i: number): Project {
  const at = `projects[${i}]`;
  for (const k of ["id", "name", "tagline", "cluster", "detail"]) {
    if (!str(p?.[k])) throw new Error(`${at}.${k} must be a non-empty string`);
  }
  if (!CLUSTERS.has(p.cluster)) throw new Error(`${at}.cluster invalid: ${p.cluster}`);
  if (!Array.isArray(p.stack) || !p.stack.every((s: unknown) => str(s))) {
    throw new Error(`${at}.stack must be a string[]`);
  }
  if (!Array.isArray(p.links)) throw new Error(`${at}.links must be an array`);
  p.links.forEach((l: any, j: number) => {
    if (!str(l?.label)) throw new Error(`${at}.links[${j}].label must be a non-empty string`);
    if (!LINK_KINDS.has(l?.kind)) throw new Error(`${at}.links[${j}].kind invalid: ${l?.kind}`);
    if (l.url !== undefined && typeof l.url !== "string") {
      throw new Error(`${at}.links[${j}].url must be a string when present`);
    }
  });
  if (p.status !== undefined && p.status !== "live") {
    throw new Error(`${at}.status must be "live" when present`);
  }
  return p as Project;
}

export function loadProjects(file: string): Project[] {
  const raw = JSON.parse(fs.readFileSync(file, "utf8")) as unknown;
  if (!Array.isArray(raw)) throw new Error("projects.json must be an array");
  return raw.map((p, i) => validate(p, i));
}
