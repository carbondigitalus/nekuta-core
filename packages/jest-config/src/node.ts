import type { Config } from '@jest/types';

export const nodeJestConfig: Config.InitialOptions = {
    moduleFileExtensions: ['js', 'json', 'ts'],
    testRegex: '.*\\.test\\.ts$',
    extensionsToTreatAsEsm: ['.ts'],
    transform: {
        // diagnostics.ignoreCodes: silences ts-jest's TS151002 ("hybrid module kind... only
        // supported in isolatedModules: true") for a consumer whose tsconfig uses "module":
        // "nodenext" — actually turning on isolatedModules changes ts-jest's transform to
        // per-file transpilation, which broke ESM detection for setupFilesAfterEnv entirely; this
        // just mutes the (otherwise harmless) warning without changing how anything transforms.
        '^.+\\.tsx?$': [
            'ts-jest',
            { useESM: true, diagnostics: { ignoreCodes: [151002] } }
        ]
    },
    // A package using NodeNext module resolution writes explicit `.js` extensions in its relative
    // imports (pointing at the eventual compiled output) even though the actual file on disk
    // during a Jest run is still `.ts` — strip the extension back off so Jest's resolver finds the
    // source file instead of a nonexistent `.js` one. Standard ts-jest/NodeNext ESM pattern.
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1'
    },
    testEnvironment: 'node',
    verbose: true
};
