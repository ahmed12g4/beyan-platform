import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
    "scripts/**",
    "migrations/**",
  ]),
  // Project-specific rule overrides
  {
    rules: {
      // Downgrade to warn — Supabase dynamic types require `any` in many places.
      // Gradually replace with proper types over time.
      "@typescript-eslint/no-explicit-any": "warn",
      // Allow unused vars that start with _ (conventional ignore prefix)
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
      // Next.js img usage is fine when using next/image
      "@next/next/no-img-element": "warn",
    },
  },
]);

export default eslintConfig;

