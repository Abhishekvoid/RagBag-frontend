// tailwind.config.ts

import type { Config } from "tailwindcss"
import typography from "@tailwindcss/typography"
import animate from "tailwindcss-animate"

const config = {
  darkMode: "class",
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // Your theme from shadcn/ui will be here
    },
  },
  plugins: [
    animate,
    typography,
  ],
} satisfies Config

export default config