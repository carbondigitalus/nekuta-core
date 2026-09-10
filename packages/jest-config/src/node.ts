import type { Config } from '@jest/types';

export const nodeJestConfig: Config.InitialOptions = {
    moduleFileExtensions: ['js', 'json', 'ts'],
    testRegex: '.*\\.test\\.ts$',
    extensionsToTreatAsEsm: ['.ts'],
    transform: {
        '^.+\\.tsx?$': ['ts-jest', { useESM: true }]
    },
    testEnvironment: 'node',
    verbose: true
};
