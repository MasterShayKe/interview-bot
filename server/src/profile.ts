import fs from "node:fs";

export interface Stat { value: string; label: string; }
export interface Job { period: string; role: string; org: string; }
export interface Partner { name: string; blurb: string; url?: string; }
export interface Profile {
  hero: { kicker?: string; headline: string; subhead: string };
  stats: Stat[];
  experience: Job[];
  about: string[];
  partners: Partner[];
}

function str(v: unknown): v is string { return typeof v === "string" && v.length > 0; }

export function loadProfile(file: string): Profile {
  const p = JSON.parse(fs.readFileSync(file, "utf8")) as any;
  if (!str(p?.hero?.headline)) throw new Error("profile.hero.headline must be a non-empty string");
  if (!str(p?.hero?.subhead)) throw new Error("profile.hero.subhead must be a non-empty string");
  if (!Array.isArray(p.stats)) throw new Error("profile.stats must be an array");
  p.stats.forEach((s: any, i: number) => {
    if (!str(s?.value) || !str(s?.label)) throw new Error(`profile.stats[${i}] needs value+label`);
  });
  if (!Array.isArray(p.experience)) throw new Error("profile.experience must be an array");
  p.experience.forEach((j: any, i: number) => {
    if (!str(j?.period) || !str(j?.role) || !str(j?.org)) throw new Error(`profile.experience[${i}] needs period+role+org`);
  });
  if (!Array.isArray(p.about) || !p.about.every((a: unknown) => str(a))) throw new Error("profile.about must be string[]");
  if (!Array.isArray(p.partners)) throw new Error("profile.partners must be an array");
  p.partners.forEach((pt: any, i: number) => {
    if (!str(pt?.name) || !str(pt?.blurb)) throw new Error(`profile.partners[${i}] needs name+blurb`);
    if (pt.url !== undefined && typeof pt.url !== "string") throw new Error(`profile.partners[${i}].url must be a string when present`);
  });
  return p as Profile;
}
