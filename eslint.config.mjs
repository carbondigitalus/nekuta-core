// Shared Modules
import { baseConfig } from '@veterandb/eslint-config/base';

export default [
    {
        ignores: ['apps/**', 'packages/**', 'dist/**', 'node_modules/**']
    },
    ...baseConfig
];
