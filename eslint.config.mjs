import comments from '@eslint-community/eslint-plugin-eslint-comments/configs';
import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import vitest from '@vitest/eslint-plugin';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import noSecrets from 'eslint-plugin-no-secrets';
import perfectionist from 'eslint-plugin-perfectionist';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import pluginPromise from 'eslint-plugin-promise';
import security from 'eslint-plugin-security';
import { defineConfig, globalIgnores } from 'eslint/config';
import { configs as tseslintConfigs } from 'typescript-eslint';

export default defineConfig([
  js.configs.recommended,

  tseslintConfigs.recommended,

  ...nextVitals,
  ...nextTs,

  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),

  comments.recommended,

  stylistic.configs.customize({
    indent: 2,
    jsx: true,
    quotes: 'single',
    semi: true,
  }),

  eslintPluginPrettierRecommended,

  perfectionist.configs['recommended-natural'],

  pluginPromise.configs['flat/recommended'],

  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,tsx,jsx}'],
    plugins: {
      'no-secrets': noSecrets,
    },
    rules: {
      'no-secrets/no-secrets': ['error', { ignoreContent: '^https?://' }],
    },
  },

  security.configs.recommended,

  {
    files: ['test/**', 'tests/**', 'src/**/*.test.ts', 'src/**/*.test.tsx'],
    plugins: {
      vitest,
    },
    rules: {
      ...vitest.configs.recommended.rules,
      'vitest/max-nested-describe': ['error', { max: 3 }],
    },
  },

  {
    rules: {
      '@stylistic/quotes': [
        'error',
        'single',
        {
          allowTemplateLiterals: 'always',
          avoidEscape: true,
        },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    rules: {
      'perfectionist/sort-interfaces': ['error', { type: 'unsorted' }],
      'perfectionist/sort-jsx-props': ['error', { type: 'unsorted' }],
      'perfectionist/sort-objects': ['error', { type: 'unsorted' }],
      'security/detect-object-injection': 'off',
    },
  },
]);
