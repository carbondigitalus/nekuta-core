// NPM Modules
import nextJest from 'next/jest';
import type { Config } from 'jest';

type NextJestFactoryOptions = {
    dir: string;
    overrides?: Config;
};

export default function createNextJestConfig({
    dir,
    overrides
}: NextJestFactoryOptions): Promise<Config> {
    const createJestConfig = nextJest({ dir });

    const baseConfig: Config = {
        collectCoverage: true,
        coverageDirectory: 'coverage',
        coverageProvider: 'v8',
        coveragePathIgnorePatterns: [
            '/coverage/',
            '/node_modules/',
            '/.next/',
            '/dist/',
            'eslint.config.js',
            'jest.config.(js|ts)',
            'prettier.config.js'
        ],
        coverageReporters: ['html', 'json', 'lcov', 'text-summary'],
        moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
        reporters: ['default'],
        testEnvironment: 'jsdom',
        verbose: true
    };

    const merged: Config = {
        ...baseConfig,
        ...(overrides ?? {}),
        moduleNameMapper: {
            ...(baseConfig.moduleNameMapper ?? {}),
            ...(overrides?.moduleNameMapper ?? {})
        }
    };

    // next/jest returns a config (often Promise-based) with internal types.
    // Cast it so our exported type stays clean for .d.ts emit.
    return createJestConfig(merged) as unknown as Promise<Config>;
}
