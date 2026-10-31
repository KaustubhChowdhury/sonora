/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0c0d12",
        surface: {
          DEFAULT: "#13151b",
          muted: "#181b23",
          elevated: "#1e222c",
          border: "rgba(255, 255, 255, 0.08)",
          hover: "rgba(255, 255, 255, 0.05)"
        },
        accent: {
          DEFAULT: "#8b5cf6",
          hover: "#a78bfa",
          light: "#c4b5fd",
          muted: "rgba(139, 92, 246, 0.15)"
        },
        studio: {
          green: "#10b981",
          gold: "#f59e0b",
          cyan: "#06b6d4",
          red: "#ef4444"
        }
      },
      fontFamily: {
        sans: [
          "Inter",
          "Geist",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif"
        ],
        mono: [
          "JetBrains Mono",
          "Geist Mono",
          "Consolas",
          "monospace"
        ]
      }
    },
  },
  plugins: [],
}
