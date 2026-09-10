import { renderToString } from 'react-dom/server';
import { createNekuta } from '../store/index.js';
import { connectStore, type MappedStoreProps } from './connect.js';
import { NekutaProvider } from './context.js';
import { defineStore } from '../store/index.js';
import { useStore } from './useStore.js';
import { Component } from 'react';

const useCounterStore = defineStore({
    id: 'counter',
    state: () => ({ count: 3 })
});

function FunctionalProbe() {
    const store = useStore(useCounterStore);
    return <span>{store.count}</span>;
}

class ClassProbe extends Component<
    MappedStoreProps<{ counter: typeof useCounterStore }>
> {
    override render() {
        return <span>{this.props.counter.count}</span>;
    }
}
const ConnectedProbe = connectStore({ counter: useCounterStore }, ClassProbe);

/**
 * Regression test: useSyncExternalStore requires a `getServerSnapshot` argument to render on the
 * server at all (React throws "Missing getServerSnapshot" otherwise) — this was missing until a
 * real Next.js App Router build (which prerenders by default) caught it. renderToString exercises
 * the same server-hook-dispatcher path Next's prerendering does, without needing a running app.
 */
describe('server rendering', () => {
    it('useStore()-based components render server-side without throwing', () => {
        const nekuta = createNekuta();
        expect(() =>
            renderToString(
                <NekutaProvider nekuta={nekuta}>
                    <FunctionalProbe />
                </NekutaProvider>
            )
        ).not.toThrow();
    });

    it('connectStore()-based components render server-side without throwing', () => {
        const nekuta = createNekuta();
        expect(() =>
            renderToString(
                <NekutaProvider nekuta={nekuta}>
                    <ConnectedProbe />
                </NekutaProvider>
            )
        ).not.toThrow();
    });
});
