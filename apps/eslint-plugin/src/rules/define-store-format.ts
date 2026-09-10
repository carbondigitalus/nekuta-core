import type { Rule } from 'eslint';
import type { SimpleCallExpression } from 'estree';

export type StoreFormat = 'schema' | 'hooks';

/** `defineStore()`'s two call shapes: `{ id, state, getters, actions }` vs. `(id, () => ({...}))`. */
const NEKUTA_SOURCES = new Set(['@nekuta/core']);

const EXAMPLE_BY_FORMAT: Record<StoreFormat, string> = {
    schema: 'defineStore({ id, state, getters, actions })',
    hooks: 'defineStore(id, () => { ...; return {...}; })'
};

function classifyDefineStoreCall(
    node: SimpleCallExpression
): StoreFormat | undefined {
    const [first, second] = node.arguments;

    if (node.arguments.length === 1 && first?.type === 'ObjectExpression') {
        return 'schema';
    }

    if (
        node.arguments.length === 2 &&
        (second?.type === 'ArrowFunctionExpression' ||
            second?.type === 'FunctionExpression')
    ) {
        return 'hooks';
    }

    return undefined;
}

export const defineStoreFormat: Rule.RuleModule = {
    meta: {
        type: 'suggestion',
        docs: {
            description:
                "Require every defineStore() call in the project to use the same style ('schema' or 'hooks')"
        },
        schema: [
            {
                type: 'object',
                properties: {
                    format: { type: 'string', enum: ['schema', 'hooks'] }
                },
                additionalProperties: false
            }
        ],
        messages: {
            wrongFormat:
                "This store uses the '{{actual}}' style, but this project is configured to only use '{{expected}}' style: {{example}}"
        }
    },
    create(context): Rule.RuleListener {
        const expectedFormat: StoreFormat | undefined =
            context.options[0]?.format;

        // No `format` configured — an individual store still has to be internally one shape or
        // the other (that's inherent to defineStore()'s own two overloads), but nothing here
        // enforces every store in the project agreeing on the same one.
        if (!expectedFormat) {
            return {};
        }

        const defineStoreLocalNames = new Set<string>();

        return {
            ImportDeclaration(node) {
                if (
                    typeof node.source.value !== 'string' ||
                    !NEKUTA_SOURCES.has(node.source.value)
                ) {
                    return;
                }

                for (const specifier of node.specifiers) {
                    if (
                        specifier.type === 'ImportSpecifier' &&
                        specifier.imported.type === 'Identifier' &&
                        specifier.imported.name === 'defineStore'
                    ) {
                        defineStoreLocalNames.add(specifier.local.name);
                    }
                }
            },
            CallExpression(node) {
                if (
                    node.callee.type !== 'Identifier' ||
                    !defineStoreLocalNames.has(node.callee.name)
                ) {
                    return;
                }

                const actualFormat = classifyDefineStoreCall(node);
                if (!actualFormat || actualFormat === expectedFormat) {
                    return;
                }

                context.report({
                    node,
                    messageId: 'wrongFormat',
                    data: {
                        actual: actualFormat,
                        expected: expectedFormat,
                        example: EXAMPLE_BY_FORMAT[expectedFormat]
                    }
                });
            }
        };
    }
};
