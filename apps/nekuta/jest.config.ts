// NPM Modules
import type { Config } from '@jest/types';

// Shared Modules
import { nodeJestConfig } from '@nekuta/jest-config/node';

const config: Config.InitialOptions = {
    ...nodeJestConfig,
    collectCoverageFrom: ['src/**/*.ts'],
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/.turbo/',
        '/coverage/',
        '/dist/',
        'index.ts',
        '**/*.d.ts'
    ],
    coverageReporters: ['html', 'json', 'lcov', 'text-summary']
};

export default config;
