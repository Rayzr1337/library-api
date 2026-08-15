import { createDefaultPreset } from 'ts-jest' 

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
const config = {
  testEnvironment: "node",
  transform: {
    ...tsJestTransformCfg,
  },
  testMatch: ['**/tests/**/*.test.ts'],
  setupFiles: ['<rootDir>/tests/helpers/env-setup.ts'],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  restoreMocks: true
};

export default config;
