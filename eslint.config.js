import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

// The SDK's own lint (mo-narai-sdk eslint.config.js): strict, a tool's src/ in the browser, scripts and tests in Node.
export default tseslint.config(
  { ignores: ["**/dist/**", "**/node_modules/**", "scripts/test/fixtures/**"] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  { files: ["labs/*/src/**"], languageOptions: { globals: globals.browser } },
  { files: ["scripts/**", "labs/*/test/**", "labs/*/*.mjs", "labs/*/*.ts"], languageOptions: { globals: globals.node } },
  { rules: { "@typescript-eslint/no-unused-vars": ["error", { varsIgnorePattern: "^_", argsIgnorePattern: "^_" }] } },
);
