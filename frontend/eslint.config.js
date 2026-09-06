// Flat ESLint config — required by ESLint v10 (the legacy eslintrc system was
// removed in v10). NOTE: the production build (craco/react-scripts, see
// craco.config.js) lints with its own bundled ESLint 8 via eslint-config-react-app;
// this file is for standalone CLI / editor linting only and does not affect the build.
const js = require("@eslint/js");
const globals = require("globals");
const reactHooks = require("eslint-plugin-react-hooks");

module.exports = [
  {
    ignores: [
      "build/**",
      "dist/**",
      "node_modules/**",
      "public/**",
      "coverage/**",
      "plugins/**",
      "craco.config.js",
      "eslint.config.js",
    ],
  },
  js.configs.recommended,
  {
    files: ["src/**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
        ...globals.jest,
      },
    },
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      // App.js intentionally keeps some locals; keep these non-fatal for CLI runs.
      "no-unused-vars": "warn",
      "no-empty": "warn",
      // New in ESLint 10 recommended — pre-existing patterns; keep non-fatal here.
      "no-useless-assignment": "warn",
      "preserve-caught-error": "warn",
    },
  },
];
