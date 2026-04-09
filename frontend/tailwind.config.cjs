/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./stores/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        "sidebar-bg": "#111111",
        "sidebar-text": "rgba(255,255,255,0.5)",
        "sidebar-text-active": "#22c987",
        "sidebar-active-bg": "rgba(34,201,135,0.1)",
        "sidebar-border": "rgba(255,255,255,0.07)",
        brand: "#22c987",
        "brand-dark": "#1aaa72",
        surface: "#ffffff",
        "surface-raised": "#fafafa",
        "surface-hover": "#f5f5f5",
        border: "#ebebeb",
        "border-strong": "#d4d4d4",
        "text-primary": "#111111",
        "text-secondary": "#555555",
        "text-muted": "#999999",
        "text-faint": "#bbbbbb",
        "tag-risk-bg": "#fff0f0",
        "tag-risk-text": "#b91c1c",
        "tag-promo-bg": "#fff7ed",
        "tag-promo-text": "#9a3412",
        "tag-news-bg": "#f0fdf4",
        "tag-news-text": "#166534",
        "tag-txn-bg": "#eff6ff",
        "tag-txn-text": "#1e40af"
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)"],
        serif: ["var(--font-instrument-serif)"]
      },
      fontSize: {
        xs: ["10px", "11px"],
        sm: ["12px", "13px"],
        base: ["14px", "20px"],
        md: ["15px", "22px"],
        lg: ["18px", "24px"],
        xl: ["22px", "28px"]
      },
      fontWeight: {
        regular: "400",
        medium: "500",
        semibold: "600"
      },
      spacing: {
        1: "4px",
        2: "8px",
        3: "12px",
        4: "16px",
        5: "20px",
        6: "24px",
        7: "28px",
        8: "32px",
        9: "36px",
        10: "40px",
        11: "44px",
        12: "48px",
        14: "56px",
        16: "64px",
        20: "80px"
      },
      borderRadius: {
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        full: "9999px"
      },
      boxShadow: {
        panel: "0 24px 80px rgba(17, 17, 17, 0.08)",
        card: "0 12px 40px rgba(17, 17, 17, 0.08)"
      },
      screens: {
        xs: "480px"
      }
    }
  },
  plugins: []
}
