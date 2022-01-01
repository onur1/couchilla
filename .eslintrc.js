module.exports = {
  env: {
    node: true,
    mocha: false,
    es6: true,
    browser: false
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 2018,
    ecmaFeatures: {
      jsx: false
    },
    sourceType: 'module'
  },
  rules: {
    'no-constant-condition': 'warn',
    semi: 'off',
    'arrow-parens': ['error', 'as-needed'],
    'space-before-function-paren': 'off',
    'variable-name': 'off',
    'ter-indent': 'off',
    'no-console': 'warn',
    'brace-style': ['error', '1tbs', { allowSingleLine: false }],
    curly: 'error',
    deprecation: 'off',
    'no-debugger': 'warn',
    'no-const-assign': 'error',
    'no-class-assign': 'error',
    'no-dupe-class-members': 'off',
    'no-var': 'error',
    'prefer-arrow-callback': 'error'
  }
}
