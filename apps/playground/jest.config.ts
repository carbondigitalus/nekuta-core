import type { Config } from '@jest/types';
import nextJest from 'next/jest.js';

// Calling next/jest directly (not through @nekuta/jest-config's `next` wrapper) — Jest's own
// TS-config loader for jest.config.ts files doesn't reliably unwrap a wrapped CJS default export
// (`createNextJestConfig is not a function` when going through the shared preset), so this avoids
// that interop ambiguity by using next/jest exactly the way Next's own docs show.
const createJestConfig = nextJest({ dir: '.' });

const config: Config.InitialOptions = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    testEnvironment: 'jsdom',
    collectCoverageFrom: ['components/**/*.tsx', 'stores/**/*.ts'],
    coverageReporters: ['html', 'json', 'lcov', 'text-summary']
};

export default createJestConfig(config);
