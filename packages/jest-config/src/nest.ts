import type { Config } from '@jest/types';

export const nestJestConfig: Config.InitialOptions = {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: 'src',
    testRegex: '.*\\.test\\.ts$',
    transform: {
        '^.+\\.(t|j)s$': 'ts-jest'
    },
    collectCoverageFrom: ['**/*.(t|j)s'],
    coverageDirectory: '../coverage',
    testEnvironment: 'node',
    verbose: true
};
