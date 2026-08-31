import js from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import * as reactPlugin from 'eslint-plugin-react'

export default [
  { ignores: ['dist', 'dist-electron', 'node_modules', 'electron'] },
  {
    files: ['**/*.{js,jsx}'],
    ...js.configs.recommended,
    plugins: {
      'react': reactPlugin,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        localStorage: 'readonly',
        crypto: 'readonly',
        URL: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        Promise: 'readonly',
        Date: 'readonly',
        Math: 'readonly',
        JSON: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        atob: 'readonly',
        btoa: 'readonly',
        encodeURIComponent: 'readonly',
        decodeURIComponent: 'readonly',
        structuredClone: 'readonly',
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  },
]
