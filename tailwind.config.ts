import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pinakk: { blue: "#1E40AF", orange: "#FF7A00", ink: "#111827", paper: "#F8FAFC" },
      },
    },
  },
  plugins: [],
};

export default config;
