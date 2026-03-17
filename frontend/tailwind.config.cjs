/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        soft: "0 8px 24px rgba(15, 23, 42, 0.08)",
        lift: "0 12px 32px rgba(15, 23, 42, 0.12)"
      },
      borderRadius: {
        xl: "16px"
      }
    }
  },
  plugins: []
}
