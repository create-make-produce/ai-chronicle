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
        // CSS変数を参照する形にすることで globals.css 一箇所で色管理
        bg:        "var(--color-bg)",
        "bg-sub":  "var(--color-bg-sub)",
        "bg-page": "var(--color-bg-page)",
        text:      "var(--color-text)",
        "text-sub":   "var(--color-text-sub)",
        "text-muted": "var(--color-text-muted)",
        border:    "var(--color-border)",
        accent:    "var(--color-accent)",
        "accent-bg": "var(--color-accent-bg)",
        free:      "var(--color-free)",
        "free-bg": "var(--color-free-bg)",
        price:     "var(--color-price)",
        "price-bg": "var(--color-price-bg)",
        warn:      "var(--color-warn)",
        "warn-bg": "var(--color-warn-bg)",
      },
      fontFamily: {
        // 英数字は Inter、日本語は Noto Sans JP
        sans: ["var(--font-inter)", "var(--font-noto-jp)", "system-ui", "sans-serif"],
        inter: ["var(--font-inter)", "sans-serif"],
        jp: ["var(--font-noto-jp)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
