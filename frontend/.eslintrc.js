module.exports = {
  env: {
    browser: true,
    es6: true,
  },
  extends: [
    'airbnb-base',
    'plugin:svelte/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2019,
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint', // add the TypeScript plugin
  ],
  rules: {
    'linebreak-style': 0,
    'import/first': 0,
    'max-len': ['error', { code: 120 }],
    'no-multiple-empty-lines': 'off',
    'no-plusplus': 'off',
  },
  overrides: [ // this stays the same
    {
      files: ['*.svelte'],
      parser: 'svelte-eslint-parser',
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 2021,
        ecmaFeatures: {
          globalReturn: false,
          impliedStrict: false,
          jsx: false,
        },
      },
      rules: {
        'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
        'import/no-mutable-exports': 0,
        'import/prefer-default-export': 0,
        'import/no-named-as-default': 0,
        'import/no-named-as-default-member': 0,
        'no-labels': 0,
        'no-restricted-syntax': 0,
        'no-use-before-define': 0,
        'operator-linebreak': 0,
        'no-bitwise': 0,
      },
    },
  ],
  settings: {
    'svelte3/typescript': true, // load TypeScript as peer dependency
  },
};
