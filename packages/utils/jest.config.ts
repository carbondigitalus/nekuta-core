// NPM Modules
import type { Config } from '@jest/types';

// Shared Modules
import { nestJestConfig } from '@nekuta/jest-config/nest';

const config: Config.InitialOptions = {
    ...nestJestConfig,
    collectCoverageFrom: ['**/*.ts'],
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/.turbo/',
        '/coverage/',
        '/dist/',
        '/dtos/',
        '/enums/',
        '/interfaces/',
        'index.ts',
        '**/*.d.ts'
    ],
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80
        }
    }
};

export default config;
