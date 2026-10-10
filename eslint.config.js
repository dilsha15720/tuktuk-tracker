export default [
  {
    ignores: ['node_modules/**', 'coverage/**', 'data/**', 'src/_clean/**', 'src/routes/tuk.routes.js', 'src/routes/tuk.routes.safe.js']
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        URL: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        jest: 'readonly'
      }
    },
    rules: {}
  }
];
