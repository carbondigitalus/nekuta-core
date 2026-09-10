import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

import { baseConfig } from './base.mjs';

export const nestJSConfig = (tsconfigRootDir) => [
    ...baseConfig,
    {
        files: ['**/*.ts', '**/*.tsx'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                project: ['./tsconfig.json'],
                tsconfigRootDir,
                sourceType: 'module'
            },
            globals: {
                node: true,
                jest: true
            }
        },
        plugins: {
            '@typescript-eslint': typescriptEslint,
            prettier
        },
        rules: {
            // TypeScript ESLint recommended rules
            ...typescriptEslint.configs.recommended.rules,
            ...typescriptEslint.configs['recommended-requiring-type-checking'].rules,

            // Prettier integration
            ...prettierConfig.rules,
            'prettier/prettier': 'error',

            // Custom rules
            '@typescript-eslint/interface-name-prefix': 'off',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unsafe-argument': 'off',
            '@typescript-eslint/no-unsafe-assignment': 'off',
            '@typescript-eslint/no-unsafe-member-access': 'off',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_'
                }
            ]
        }
    }
];
