import tsParser from "@typescript-eslint/parser";
import sd from "./sd-rules.js";

const LOGIC_STATEMENT_LIMIT = 2;
const VIEW_STATEMENT_LIMIT = 30;

export default [
  {
    ignores: ["**/node_modules/**", "**/dist/**", "**/vendor/**", "**/*.d.ts"],
  },
  {
    files: ["**/*.{js,jsx,mjs,cjs}"],
    languageOptions: { ecmaVersion: 2022, sourceType: "module" },
    plugins: { sd },
    rules: {
      "sd/single-return": "error",
      "sd/no-early-return": "error",
      "sd/no-forbidden-syntax": "error",
      "sd/max-statements": ["error", LOGIC_STATEMENT_LIMIT],
      eqeqeq: "error",
      "no-var": "error",
      "prefer-const": "error",
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: { sd },
    rules: {
      "sd/single-return": "error",
      "sd/no-early-return": "error",
      "sd/no-forbidden-syntax": "error",
      "sd/max-statements": ["error", LOGIC_STATEMENT_LIMIT],
      eqeqeq: "error",
      "no-var": "error",
      "prefer-const": "error",
    },
  },
  {
    files: ["**/*.{tsx,jsx}"],
    rules: {
      "sd/max-statements": ["error", VIEW_STATEMENT_LIMIT],
    },
  },
  {
    files: ["**/vite.config.ts", "**/*.config.{js,mjs,ts}"],
    rules: {
      "sd/max-statements": "off",
    },
  },
  {
    files: ["**/shared/lint/**", "**/scripts/**", "**/desktop/**"],
    rules: {
      "sd/single-return": "off",
      "sd/no-early-return": "off",
      "sd/max-statements": "off",
      "sd/no-forbidden-syntax": "off",
    },
  },
];
