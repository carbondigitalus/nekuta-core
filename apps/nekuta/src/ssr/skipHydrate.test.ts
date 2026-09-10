import { shouldHydrate, skipHydrate } from './skipHydrate';

describe('skipHydrate() / shouldHydrate()', () => {
    it('shouldHydrate() is true by default for any object', () => {
        expect(shouldHydrate({})).toBe(true);
        expect(shouldHydrate([])).toBe(true);
        expect(shouldHydrate(new Map())).toBe(true);
    });

    it('shouldHydrate() is true for primitives and nullish values', () => {
        expect(shouldHydrate(1)).toBe(true);
        expect(shouldHydrate('x')).toBe(true);
        expect(shouldHydrate(null)).toBe(true);
        expect(shouldHydrate(undefined)).toBe(true);
    });

    it('skipHydrate() marks a value so shouldHydrate() reports false for it', () => {
        const value = skipHydrate({ connection: 'live-socket' });
        expect(shouldHydrate(value)).toBe(false);
    });

    it('skipHydrate() returns the same object it was given (mutates in place)', () => {
        const value = { a: 1 };
        expect(skipHydrate(value)).toBe(value);
    });
});
