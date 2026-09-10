// NPM Modules
import type { Config } from '@jest/types';

// Shared Modules
import { nodeJestConfig } from '@nekuta/jest-config/node';

const config: Config.InitialOptions = {
    ...nodeJestConfig,
    moduleFileExtensions: ['js', 'json', 'ts', 'tsx'],
    testRegex: '.*\\.test\\.tsx?$',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    moduleNameMapper: {
        ...nodeJestConfig.moduleNameMapper,
        // Map to @nekuta/core's SOURCE, not its built dist/index.js — Jest's module system
        // doesn't run with --experimental-vm-modules, so it can't `require()` a pre-built pure-ESM
        // package regardless of ts-jest's useESM setting. Going through source means it's
        // transformed by the exact same ts-jest pipeline as this package's own files, sidestepping
        // the "already-compiled-external-ESM" problem entirely rather than fighting Jest's ESM
        // interop for a built artifact.
        '^@nekuta/core$': '<rootDir>/../nekuta/src/index.ts'
    },
    collectCoverageFrom: ['src/**/*.{ts,tsx}'],
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/.turbo/',
        '/coverage/',
        '/dist/',
        'index.ts',
        '\\.d\\.ts$'
    ],
    coverageReporters: ['html', 'json', 'lcov', 'text-summary']
};

export default config;
