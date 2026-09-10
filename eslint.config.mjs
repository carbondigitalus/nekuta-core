// Shared Modules
import { baseConfig } from '@nekuta/eslint-config/base';

export default [
    {
        ignores: ['apps/**', 'packages/**', 'dist/**', 'node_modules/**']
    },
    ...baseConfig
];
