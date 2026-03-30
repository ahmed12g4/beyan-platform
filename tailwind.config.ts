
import type { Config } from "tailwindcss";

export default {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                // ── Brand palette (defined in globals.css :root) ──
                brand: {
                    primary: "var(--brand-primary)",
                    "primary-dark": "var(--brand-primary-dark)",
                    "primary-hover": "var(--brand-primary-hover)",
                    "primary-light": "var(--brand-primary-light)",
                    accent: "var(--brand-accent)",
                    "accent-hover": "var(--brand-accent-hover)",
                },
            },
            fontFamily: {
                sans: ["var(--font-inter)", "var(--font-jakarta)", "sans-serif"],
                serif: ["var(--font-playfair)", "var(--font-lora)", "serif"],
            },
            // Global border radius tuning so all cards/buttons have light rounding
            borderRadius: {
                // keep default and lg modest for general use
                DEFAULT: "0.45rem",
                lg: "0.5rem",
                xl: "0.65rem",
                // make 2xl/3xl less pill-like for big cards/sections
                "2xl": "0.8rem",
                "3xl": "1rem",
            },
            keyframes: {
                marquee: {
                    '0%': { transform: 'translateX(0%)' },
                    '100%': { transform: 'translateX(-100%)' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                'gentle-rise': {
                    '0%': { opacity: '0', transform: 'translateY(15px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
            },
            animation: {
                marquee: 'marquee 25s linear infinite',
                slideUp: 'slideUp 0.8s ease-out forwards',
                'gentle-rise': 'gentle-rise 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
            },
            transitionDelay: {
                '100': '100ms',
                '200': '200ms',
                '300': '300ms',
                '400': '400ms',
                '500': '500ms',
            },
        },
    },
    plugins: [],
    darkMode: "class",
} satisfies Config;
