/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0B1B2B",
          light: "#122844",
          dark: "#081422",
        },
        teal: {
          DEFAULT: "#1FBFA8",
          light: "#3FDFC7",
          dark: "#159485",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        card: "0 20px 60px -15px rgba(11, 27, 43, 0.25)",
        soft: "0 8px 24px -8px rgba(11, 27, 43, 0.15)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
