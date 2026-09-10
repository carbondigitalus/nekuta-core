import { createNekuta, disposeNekuta } from './createNekuta';

describe('createNekuta()', () => {
    it('starts with an empty state tree, store registry, and plugin list', () => {
        const nekuta = createNekuta();

        expect(nekuta.state.value).toEqual({});
        expect(nekuta._s.size).toBe(0);
        expect(nekuta._p).toEqual([]);
    });

    it('use() registers a plugin and returns the instance for chaining', () => {
        const nekuta = createNekuta();
        const plugin = jest.fn();

        expect(nekuta.use(plugin)).toBe(nekuta);
        expect(nekuta._p).toEqual([plugin]);
    });

    it('disposeNekuta() stops the root scope and clears the registry/state', () => {
        const nekuta = createNekuta();
        nekuta._s.set('fake', {} as never);
        nekuta.state.value.fake = { a: 1 };

        disposeNekuta(nekuta);

        expect(nekuta._s.size).toBe(0);
        expect(nekuta.state.value).toEqual({});
        expect(nekuta._e.active).toBe(false);
    });
});
