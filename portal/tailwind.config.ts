import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14161c", panel: "#1c1f27", edge: "#2c313c",
        amber: "#E8A020", amberhi: "#FFC44D",
        fog: "#9aa0aa", paper: "#f5f5f3",
      },
      fontFamily: { mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"] },
    },
  },
  plugins: [],
} satisfies Config;
