// eslint.config.js
const nextESLintPlugin = require('@next/eslint-plugin-next');
const globals = require('globals');

module.exports = [
  // Ignore build files
  {
    ignores: ['.next/**/*', 'node_modules/**/*']
  },
  // JavaScript files
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    plugins: {
      '@next/next': nextESLintPlugin
    },
    rules: {
      ...nextESLintPlugin.configs.recommended.rules,
      ...nextESLintPlugin.configs['core-web-vitals'].rules
    }
  },
  // TypeScript files
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      },
      parser: require('@typescript-eslint/parser'),
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        },
        project: './tsconfig.json'
      }
    },
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
      '@next/next': nextESLintPlugin
    },
    rules: {
      ...require('@typescript-eslint/eslint-plugin').configs.recommended.rules,
      ...nextESLintPlugin.configs.recommended.rules,
      ...nextESLintPlugin.configs['core-web-vitals'].rules,
      // Disable some rules that are too strict for this project
      '@typescript-eslint/triple-slash-reference': 'off',
      '@typescript-eslint/no-empty-object-type': 'off'
    }
  }
];
