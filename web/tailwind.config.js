/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // Editorial serif display for authority + character.
        display: ['"Fraunces"', "Georgia", "Times New Roman", "serif"],
        // Clean modern body with a Hebrew-safe system fallback.
        sans: ['"Schibsted Grotesk"', "system-ui", "-apple-system", "Segoe UI", "Arial", "sans-serif"],
        // Technical micro-labels only.
        mono: ['"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        // Deep navy-graphite base.
        ink: {
          DEFAULT: "#0A0E16",
          950: "#070A11",
          900: "#0C111B",
          850: "#101725",
          800: "#141C2C",
          700: "#1B2434",
        },
        // Warm ivory paper tones (text).
        paper: {
          DEFAULT: "#ECEAE1",
          muted: "#A2AAB9",
          faint: "#6B7385",
        },
        // Single controlled interactive accent: refined periwinkle-azure.
        accent: {
          DEFAULT: "#8AA0FF",
          bright: "#A6B6FF",
          deep: "#6C84F2",
        },
        // Bespoke material detail (rules, indices, data emphasis) - used sparingly.
        brass: {
          DEFAULT: "#CBA96A",
          dim: "#9C8452",
        },
      },
      maxWidth: {
        prose: "68ch",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.4", transform: "scale(0.72)" },
        },
      },
      animation: {
        "fade-up": "fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both",
        "pulse-dot": "pulseDot 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
