import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      /** Full 0-100 opacity scale so colour modifiers like `border-ink-900/8` resolve. */
      opacity: Object.fromEntries(
        Array.from({ length: 101 }, (_, i) => [String(i), String(i / 100)]),
      ) as Record<string, string>,
      colors: {
        ink: {
          950: "#08080A",
          900: "#0B0B0E",
          850: "#101014",
          800: "#16161B",
          750: "#1C1C22",
          700: "#232329",
          600: "#2E2E36",
          500: "#3B3B45",
          400: "#55555F",
          300: "#7A7A86",
          200: "#A6A6B0",
          100: "#D4D4DB",
          50: "#F4F4F6",
        },
        brand: {
          50: "#FFF1F2",
          100: "#FFE0E2",
          200: "#FFC6C9",
          300: "#FF9DA2",
          400: "#FF636C",
          500: "#F5252F",
          600: "#E30613",
          700: "#BF0410",
          800: "#9C0710",
          900: "#810C13",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "Poppins", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        arabic: ["Cairo", "Tajawal", "Inter", "ui-sans-serif", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(8,8,10,.04), 0 8px 24px -12px rgba(8,8,10,.12)",
        lift: "0 12px 40px -12px rgba(8,8,10,.28)",
        glow: "0 0 0 1px rgba(227,6,19,.35), 0 12px 40px -16px rgba(227,6,19,.55)",
      },
      backgroundImage: {
        grid: "linear-gradient(to right, rgba(255,255,255,.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.045) 1px, transparent 1px)",
        "grid-dark":
          "linear-gradient(to right, rgba(8,8,10,.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(8,8,10,.05) 1px, transparent 1px)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        "slide-in": {
          "0%": { opacity: "0", transform: "translateX(24px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        shimmer: { "100%": { transform: "translateX(100%)" } },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(.8)", opacity: ".7" },
          "100%": { transform: "scale(2)", opacity: "0" },
        },
      },
      animation: {
        "fade-up": "fade-up .7s cubic-bezier(.16,1,.3,1) both",
        "fade-in": "fade-in .6s ease both",
        "slide-in": "slide-in .5s cubic-bezier(.16,1,.3,1) both",
        marquee: "marquee 32s linear infinite",
        "pulse-ring": "pulse-ring 1.8s ease-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
