import { describe, it, expect } from "vitest";
import { loadProfile } from "../src/profile.js";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const REAL = path.join(here, "../../spec/profile.json");
const INVALID = path.join(here, "fixtures/profile-invalid.json");

describe("loadProfile", () => {
  it("loads hero, stats, experience, about, partners", () => {
    const p = loadProfile(REAL);
    expect(p.hero.headline).toBeTruthy();
    expect(p.hero.subhead).toBeTruthy();
    expect(p.stats.length).toBeGreaterThanOrEqual(3);
    expect(p.experience.length).toBeGreaterThanOrEqual(4);
    for (const job of p.experience) {
      expect(job.period).toBeTruthy();
      expect(job.role).toBeTruthy();
      expect(job.org).toBeTruthy();
    }
    expect(p.about.length).toBeGreaterThan(0);
    expect(p.partners.length).toBeGreaterThan(0);
  });

  it("throws on an invalid profile", () => {
    expect(() => loadProfile(INVALID)).toThrow(/headline/);
  });
});
