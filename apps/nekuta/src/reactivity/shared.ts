export const isObject = (
    value: unknown
): value is Record<PropertyKey, unknown> =>
    typeof value === 'object' && value !== null;

export const isArray = Array.isArray;

export const isFunction = (
    value: unknown
): value is (...args: unknown[]) => unknown => typeof value === 'function';

export const isSymbol = (value: unknown): value is symbol =>
    typeof value === 'symbol';

export const isMap = (value: unknown): value is Map<unknown, unknown> =>
    Object.prototype.toString.call(value) === '[object Map]';

export const isSet = (value: unknown): value is Set<unknown> =>
    Object.prototype.toString.call(value) === '[object Set]';

export const hasOwn = (target: object, key: PropertyKey): boolean =>
    Object.prototype.hasOwnProperty.call(target, key);

export const hasChanged = (value: unknown, oldValue: unknown): boolean =>
    !Object.is(value, oldValue);

const integerKeyCache = new Map<string | symbol, boolean>();

export function isIntegerKey(key: unknown): boolean {
    if (typeof key !== 'string') {
        return false;
    }

    let cached = integerKeyCache.get(key);
    if (cached === undefined) {
        cached =
            key !== 'NaN' &&
            key[0] !== '-' &&
            String(Number.parseInt(key, 10)) === key;
        integerKeyCache.set(key, cached);
    }

    return cached;
}
