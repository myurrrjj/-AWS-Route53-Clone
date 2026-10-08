import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aws: {
          navy: "#232f3e",
          slate: "#37475a",
          steel: "#545b64",
          orange: "#ff9900",
          orangeDark: "#e88b00",
          blue: "#0972d3",
          blueDark: "#033160",
          link: "#0073bb",
          border: "#d5dbdb",
          bg: "#f2f3f3",
          panel: "#ffffff",
          text: "#16191f",
          muted: "#687078",
          green: "#037f0c",
          red: "#d13212",
        },
      },
      boxShadow: {
        card: "0 1px 1px 0 rgba(0,28,36,0.3), 1px 1px 1px 0 rgba(0,28,36,0.15)",
      },
      fontFamily: {
        sans: ["Amazon Ember", "Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
