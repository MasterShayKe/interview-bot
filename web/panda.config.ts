import { defineConfig } from "@pandacss/dev";

/**
 * Panda CSS — powers ONLY the new immersive centerpiece (the
 * ProjectConstellation overlay + entry UI). It coexists with Tailwind: Panda
 * is namespaced under the `pd-` class prefix and emits a separate layer cascade
 * so it never collides with Tailwind's utilities. Everything else in the app
 * stays on Tailwind.
 */
export default defineConfig({
  preflight: false, // Tailwind already owns the global reset.
  prefix: "pd",
  include: ["./src/**/*.{ts,tsx}"],
  exclude: [],
  // We hand-write semantic tokens; no JSX-prop styling needed.
  jsxFramework: undefined,
  theme: {
    extend: {
      tokens: {
        colors: {
          ink: { value: "#0a0810" },
          accent: { value: "#a855f7" },
          accentDim: { value: "#8b5cf6" },
          clusterAi: { value: "#8b5cf6" },
          clusterTrading: { value: "#34d399" },
          clusterCommunity: { value: "#ec4899" },
          clusterWeb: { value: "#fbbf24" },
        },
        fonts: {
          display: { value: '"Instrument Serif", Georgia, serif' },
          sans: { value: '"Schibsted Grotesk", system-ui, sans-serif' },
          mono: { value: '"JetBrains Mono", ui-monospace, monospace' },
        },
      },
    },
  },
  // Emit codegen next to source so Vite resolves it as a normal import.
  outdir: "src/styled-system",
});
