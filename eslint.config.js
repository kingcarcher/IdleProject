import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import { defineConfig, globalIgnores } from 'eslint/config';

const layeringMessage =
  'Engine and content are pure TypeScript: they must not import React, the DOM, or src/ui.';

const noUiOrReact = {
  paths: [
    { name: 'react', message: layeringMessage },
    { name: 'react-dom', message: layeringMessage },
  ],
  patterns: [
    { group: ['react/*', 'react-dom/*'], message: layeringMessage },
    { group: ['@/ui', '@/ui/*', '**/ui', '**/ui/*'], message: layeringMessage },
  ],
};

export default defineConfig([
  globalIgnores(['dist', 'coverage']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    // Enforces the one-way dependency direction: ui -> engine -> content.
    files: ['src/engine/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', noUiOrReact],
    },
  },
  {
    files: ['src/content/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: noUiOrReact.paths,
          patterns: [
            ...noUiOrReact.patterns,
            {
              group: ['@/engine', '@/engine/*', '**/engine', '**/engine/*'],
              message: 'Content is plain data; it must not depend on the engine.',
            },
          ],
        },
      ],
    },
  },
  eslintConfigPrettier,
]);
