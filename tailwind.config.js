/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        primary: {
          50: "#f0f4ff",
          100: "#e0eaff",
          500: "#4f7ef8",
          600: "#3b6ef0",
          700: "#2a5de8",
          800: "#1a4cd0",
          900: "#0d3ab8",
        },
        surface: {
          900: "#0f1117",
          800: "#161b27",
          700: "#1e2536",
          600: "#252d40",
        },
      },
    },
  },
  plugins: [],
};
