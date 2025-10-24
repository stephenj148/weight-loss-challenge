module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'off',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-explicit-any': 'off'
  },
  ignorePatterns: ['src/hooks/useAuth.ts']
};
