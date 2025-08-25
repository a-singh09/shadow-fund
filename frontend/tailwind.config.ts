import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
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
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          glow: "hsl(var(--primary-glow))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          light: "hsl(var(--accent-light))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        glass: {
          DEFAULT: "rgb(var(--glass-bg))",
          border: "rgb(var(--glass-border))",
          strong: "rgb(var(--glass-strong))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        "glow-red": "var(--glow-red)",
        "glow-subtle": "var(--glow-subtle)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in-up": {
          "0%": {
            opacity: "0",
            transform: "translateY(30px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "lock-pulse": {
          "0%, 100%": {
            opacity: "0.6",
            transform: "scale(1)",
          },
          "50%": {
            opacity: "1",
            transform: "scale(1.05)",
          },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "33%": { transform: "translateY(-20px) rotate(2deg)" },
          "66%": { transform: "translateY(10px) rotate(-1deg)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        // Constellation-specific animations
        "constellation-draw-fast": {
          "0%": {
            strokeDashoffset: "1000",
            opacity: "0",
            filter: "drop-shadow(0 0 2px currentColor)",
          },
          "100%": {
            strokeDashoffset: "0",
            opacity: "1",
            filter:
              "drop-shadow(0 0 12px currentColor) drop-shadow(0 0 20px currentColor)",
          },
        },
        "constellation-glow-fast": {
          "0%": { filter: "drop-shadow(0 0 8px currentColor)" },
          "100%": {
            filter:
              "drop-shadow(0 0 25px currentColor) drop-shadow(0 0 40px currentColor)",
          },
        },
        "constellation-float-slow": {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "33%": { transform: "translateY(-20px) rotate(2deg)" },
          "66%": { transform: "translateY(10px) rotate(-1deg)" },
        },
        "constellation-float-fast": {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg) scale(1.2)" },
          "33%": { transform: "translateY(-30px) rotate(3deg) scale(1.3)" },
          "66%": { transform: "translateY(15px) rotate(-2deg) scale(1.1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in-up": "fade-in-up 0.6s ease-out",
        "lock-pulse": "lock-pulse 2s ease-in-out infinite",
        float: "float 20s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        // Constellation animations
        "constellation-draw-fast":
          "constellation-draw-fast 0.3s ease-out forwards",
        "constellation-glow-fast":
          "constellation-glow-fast 0.3s ease-in-out infinite alternate",
        "constellation-float-slow":
          "constellation-float-slow 20s ease-in-out infinite",
        "constellation-float-fast":
          "constellation-float-fast 1s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
