export default [
  {
    files: ['**/*.js'],
    ignores: ['node_modules/**', 'server.js'],
    languageOptions: {
      sourceType: 'module',
      ecmaVersion: 2021,
    },
    plugins: {},
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off',
      semi: ['error', 'always'],
      quotes: ['error', 'single'],
    },
  },
];
