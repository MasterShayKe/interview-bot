import { describe, it, expect } from "vitest";
import { loadProjects } from "../src/projects.js";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const REAL = path.join(here, "../../spec/projects.json");
const INVALID = path.join(here, "fixtures/projects-invalid.json");

describe("loadProjects", () => {
  it("loads the real manifest with all required fields", () => {
    const projects = loadProjects(REAL);
    expect(projects.length).toBe(7);
    for (const p of projects) {
      expect(p.id).toBeTruthy();
      expect(p.name).toBeTruthy();
      expect(p.tagline).toBeTruthy();
      expect(["ai", "trading", "community", "web"]).toContain(p.cluster);
      expect(Array.isArray(p.stack)).toBe(true);
      expect(Array.isArray(p.links)).toBe(true);
    }
  });

  it("has unique project ids", () => {
    const ids = loadProjects(REAL).map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("throws on an invalid manifest", () => {
    expect(() => loadProjects(INVALID)).toThrow(/cluster/);
  });
});
