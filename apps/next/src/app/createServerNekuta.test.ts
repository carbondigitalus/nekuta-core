import { getServerNekuta } from './createServerNekuta.js';

describe('getServerNekuta()', () => {
    it('returns a usable Nekuta instance', () => {
        const nekuta = getServerNekuta();
        expect(nekuta._s).toBeInstanceOf(Map);
        expect(nekuta.state.value).toEqual({});
    });

    // React's cache() only memoizes within an ACTUAL Server Component render pass — its
    // request-scoping is provided by React's own RSC dispatcher, which a plain Jest test isn't
    // running inside of. Outside that context each call is expected to just invoke the factory
    // fresh, which this documents rather than asserts as a bug: the real per-request memoization
    // is Next's responsibility to exercise, not something a unit test here can fake convincingly.
    it('is not memoized outside of an actual RSC render (documented limitation of this test environment)', () => {
        expect(getServerNekuta()).not.toBe(getServerNekuta());
    });
});
