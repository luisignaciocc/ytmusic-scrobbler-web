module.exports = {
  extends: [
    "plugin:@typescript-eslint/recommended",
    "prettier",
    "plugin:deprecation/recommended",
  ],
  plugins: ["unused-imports", "simple-import-sort"],
  parser: "@typescript-eslint/parser",
  rules: {
    "no-console": [
      2,
      {
        allow: ["warn", "error"],
      },
    ],
    "simple-import-sort/exports": "error",
    "simple-import-sort/imports": "error",
    "unused-imports/no-unused-imports": "error",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        varsIgnorePattern: "^_",
        argsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      },
    ],
    "react-hooks/exhaustive-deps": "off",
  },
};
