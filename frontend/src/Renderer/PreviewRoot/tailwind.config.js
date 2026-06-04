/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"], // 🔥 REQUIRED
  theme: {
    extend: {
      keyframes: {
        "loader-slide": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(300%)" },
        },
      },
      animation: {
        "loader-slide": "loader-slide 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
