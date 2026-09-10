// NPM Modules
import type { Config } from '@jest/types';

// Shared Modules
import { nodeJestConfig } from '@nekuta/jest-config/node';

const config: Config.InitialOptions = {
    ...nodeJestConfig,
    moduleFileExtensions: ['js', 'json', 'ts', 'tsx'],
    testRegex: '.*\\.test\\.tsx?$',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
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
