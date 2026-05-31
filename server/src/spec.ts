import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";

export interface Persona {
  name: string;
  subject_name: string;
  tone: string;
  language_rule: string;
  contact_email: string;
  budget_rest_message: string;
  rules: string[];
  suggested_questions: string[];
}

export interface FactFile {
  path: string; // relative to facts/, posix separators
  content: string;
}

export interface Spec {
  persona: Persona;
  facts: FactFile[];
}

function walkMarkdown(dir: string, base: string): FactFile[] {
  const out: FactFile[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkMarkdown(full, base));
    } else if (entry.name.endsWith(".md")) {
      const rel = path.relative(base, full).split(path.sep).join("/");
      out.push({ path: rel, content: fs.readFileSync(full, "utf8") });
    }
  }
  return out;
}

export function loadSpec(specDir: string): Spec {
  const persona = parse(
    fs.readFileSync(path.join(specDir, "persona.yaml"), "utf8"),
  ) as Persona;
  const factsDir = path.join(specDir, "facts");
  const facts = walkMarkdown(factsDir, factsDir).sort((a, b) =>
    a.path.localeCompare(b.path),
  );
  return { persona, facts };
}
