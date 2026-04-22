// @ts-check

import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  {
    ignores: [
      "node_modules/**",
      "projects/*/dist/**",
      "projects/*/node_modules/**",
      "projects/*/**/*.d.ts",
    ],
  },

  eslint.configs.recommended,
  tseslint.configs.recommended,

  {
    files: ["projects/*/ts/**/*.ts"],

    rules: {
      // 🔥 adapté core
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-object-type": "off",

      // 👍 utile mais soft
      "@typescript-eslint/ban-ts-comment": "warn",

      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
    },
  }
);
