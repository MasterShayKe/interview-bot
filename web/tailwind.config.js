export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  safelist: [
    "bg-cluster-ai",
    "bg-cluster-trading",
    "bg-cluster-community",
    "bg-cluster-web",
    "text-cluster-ai",
    "text-cluster-trading",
    "text-cluster-community",
    "text-cluster-web",
    "shadow-cluster-ai",
    "shadow-cluster-trading",
    "shadow-cluster-community",
    "shadow-cluster-web",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Instrument Serif"', "Georgia", "serif"],
        sans: ['"Schibsted Grotesk"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      colors: {
        ink: {
          DEFAULT: "#0A0B0D",
          800: "#101216",
          700: "#16181D",
          600: "#1D2026",
        },
        accent: {
          DEFAULT: "#a855f7",
          dim: "#8b5cf6",
        },
        cluster: {
          ai: "#8b5cf6",
          trading: "#34d399",
          community: "#ec4899",
          web: "#fbbf24",
        },
        live: "#34d399",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.35", transform: "scale(0.7)" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(24px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        railIn: {
          "0%": { opacity: "0", transform: "translateX(40px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        sheetUp: {
          "0%": { opacity: "0", transform: "translateY(28px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scrim: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        dockIn: {
          "0%": { opacity: "0", transform: "translateY(16px) scale(0.96)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        floatY: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "fade-up": "fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) both",
        blink: "blink 1.1s step-end infinite",
        "pulse-dot": "pulseDot 2.4s ease-in-out infinite",
        "slide-in": "slideIn 0.26s cubic-bezier(0.16, 1, 0.3, 1) both",
        "rail-in": "railIn 0.34s cubic-bezier(0.16, 1, 0.3, 1) both",
        "sheet-up": "sheetUp 0.32s cubic-bezier(0.16, 1, 0.3, 1) both",
        scrim: "scrim 0.25s ease both",
        "dock-in": "dockIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
        "float-y": "floatY 4.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
