import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
    rootDir: '.',
    testEnvironment: 'jsdom',
    testRegex: 'tests/.*\\.test\\.tsx?$',
    transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }]
    },
    moduleNameMapper: {
        '\\.(scss|sass|css)$': 'identity-obj-proxy',
        '^@theme/Layout$': '<rootDir>/tests/__mocks__/theme-layout.tsx',
        '^@docusaurus/useDocusaurusContext$':
            '<rootDir>/tests/__mocks__/useDocusaurusContext.ts'
    },
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'html', 'lcov'],
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
