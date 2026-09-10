import { RuleTester } from 'eslint';
import { defineStoreFormat } from './define-store-format.js';

const ruleTester = new RuleTester({
    languageOptions: {
        ecmaVersion: 2022,
        sourceType: 'module'
    }
});

const SCHEMA_STORE = `
import { defineStore } from '@nekuta/core';

export const useCounterStore = defineStore({
    id: 'counter',
    state: () => ({ count: 0 })
});
`;

const HOOKS_STORE = `
import { defineStore, ref } from '@nekuta/core';

export const useTodoStore = defineStore('todo', () => {
    const count = ref(0);
    return { count };
});
`;

const MIXED_STORES = `
import { defineStore, ref } from '@nekuta/core';

export const useCounterStore = defineStore({
    id: 'counter',
    state: () => ({ count: 0 })
});

export const useTodoStore = defineStore('todo', () => {
    const count = ref(0);
    return { count };
});
`;

ruleTester.run('define-store-format', defineStoreFormat, {
    valid: [
        // No options passed at all — mixing is allowed.
        { code: SCHEMA_STORE },
        { code: HOOKS_STORE },
        { code: MIXED_STORES },
        // Matches the configured format.
        { code: SCHEMA_STORE, options: [{ format: 'schema' }] },
        { code: HOOKS_STORE, options: [{ format: 'hooks' }] },
        // A call whose shape can't be statically classified (e.g. a variable) is left alone.
        {
            code: `import { defineStore } from '@nekuta/core';\nconst opts = {};\ndefineStore(opts);`,
            options: [{ format: 'hooks' }]
        },
        // A same-named function NOT imported from '@nekuta/core' is ignored entirely.
        {
            code: `import { defineStore } from 'some-other-lib';\ndefineStore('x', () => ({}));`,
            options: [{ format: 'schema' }]
        }
    ],
    invalid: [
        {
            code: HOOKS_STORE,
            options: [{ format: 'schema' }],
            errors: [{ messageId: 'wrongFormat' }]
        },
        {
            code: SCHEMA_STORE,
            options: [{ format: 'hooks' }],
            errors: [{ messageId: 'wrongFormat' }]
        },
        {
            code: MIXED_STORES,
            options: [{ format: 'schema' }],
            errors: [{ messageId: 'wrongFormat' }]
        },
        {
            // An aliased import is still tracked correctly.
            code: `import { defineStore as define } from '@nekuta/core';\ndefine('counter', () => ({}));`,
            options: [{ format: 'schema' }],
            errors: [{ messageId: 'wrongFormat' }]
        }
    ]
});
