/**
 * Jest config for PURE logic only — utils and hooks with no React tree.
 *
 * Deliberately not `jest-expo`: that preset boots a React Native environment to
 * render components, which these tests never do. ts-jest against node is far faster
 * and keeps the suite runnable in CI without native deps.
 *
 * Component tests, when they arrive, want a second project with the jest-expo preset.
 */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/utils', '<rootDir>/hooks', '<rootDir>/lib'],
    testMatch: ['**/__tests__/**/*.test.ts'],
    moduleNameMapper: {
        // Mirrors the "@/*" -> "./*" alias in tsconfig.json
        '^@/(.*)$': '<rootDir>/$1',
    },
    clearMocks: true,
};
