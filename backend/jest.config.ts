import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/src/__tests__/**/*.test.ts'],
  testTimeout: 15000,
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  // Transform ESM-only packages (uuid v14, google-auth-library...)
  transformIgnorePatterns: [
    'node_modules/(?!(uuid|google-auth-library|gtoken|gaxios|googleapis-common)/)',
  ],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: { types: ['jest', 'node'] } }],
  },
};

export default config;
