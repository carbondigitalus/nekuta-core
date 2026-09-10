import { defineStoreFormat } from './rules/define-store-format.js';

const plugin = {
    meta: {
        name: '@nekuta/eslint-plugin',
        version: '0.1.0-alpha.0'
    },
    rules: {
        'define-store-format': defineStoreFormat
    }
};

export default plugin;
export const rules = plugin.rules;
export type { StoreFormat } from './rules/define-store-format.js';
