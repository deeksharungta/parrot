import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-outfit)"],
        serif: ["var(--font-instrument-serif)"],
        zing: ["var(--font-zing)"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        danger: "#D60000",
      },
      boxShadow: {
        "danger-top": "0px -4px 0px 0px #D60000 inset",
      },
      animation: {
        "fade-out": "1s fadeOut 3s ease-out forwards",
      },
      keyframes: {
        fadeOut: {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
