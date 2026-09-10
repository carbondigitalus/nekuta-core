import { useCallback, type ComponentProps, type ComponentType } from 'react';
import type { NekutaInstance, StoreGeneric } from '../store/index.js';
import { useSubscribeForRerender } from './subscription.js';
import { useNekuta } from './useNekuta.js';

export type MapStoresToProps = Record<
    string,
    (nekuta?: NekutaInstance) => StoreGeneric
>;

export type MappedStoreProps<M extends MapStoresToProps> = {
    [K in keyof M]: ReturnType<M[K]>;
};

function useMappedStores<M extends MapStoresToProps>(
    mapStoresToProps: M
): MappedStoreProps<M> {
    const nekuta = useNekuta();

    // Plain function calls, not hooks — defineStore()'s returned accessor doesn't itself call any
    // React hooks (see store/defineStore.ts), so looping over a fixed set of them here is safe,
    // unlike looping actual hook calls would be.
    const stores = {} as MappedStoreProps<M>;
    for (const key of Object.keys(mapStoresToProps)) {
        stores[key as keyof M] = mapStoresToProps[key](
            nekuta
        ) as MappedStoreProps<M>[keyof M];
    }

    const subscribe = useCallback(
        (onChange: () => void) => {
            const unsubscribes = Object.keys(mapStoresToProps).map((key) =>
                mapStoresToProps[key](nekuta).$subscribe(onChange, {
                    detached: true
                })
            );
            return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
        },
        [nekuta, mapStoresToProps]
    );

    useSubscribeForRerender(subscribe);

    return stores;
}

/**
 * Class-component support: a HOC injecting one or more stores as props. The HOC itself is a
 * function component (using hooks internally) — the wrapped class component receives plain props
 * and needs no hooks of its own, the same shape as react-redux's `connect()`.
 *
 * `C`'s props are inferred directly from `WrappedComponent` (ordinary, reliable inference) and the
 * returned component's props are computed via `Omit<..., keyof M>` — deliberately NOT the more
 * obvious `P & MappedStoreProps<M>`/`ComponentType<P>` shape, since TS can't reliably infer `P`
 * as "whatever's left after subtracting the store props" from an intersection constraint; `Omit`
 * performs that subtraction on an already-known type instead, which it handles just fine. The `C`
 * constraint is deliberately just `ComponentType<any>` (not e.g. `ComponentType<MappedStoreProps<M>
 * & ...>`) for the same reason — constraining it that way rejects any wrapped component whose
 * mapped-store prop types are more specific than `unknown` (a `{ prefix: string }` own-prop
 * alongside the mapped stores, for instance), a bad trade for a check that only partially works.
 */
export function connectStore<
    M extends MapStoresToProps,
    C extends ComponentType<any>
>(
    mapStoresToProps: M,
    WrappedComponent: C
): ComponentType<Omit<ComponentProps<C>, keyof M>> {
    function ConnectedComponent(props: Omit<ComponentProps<C>, keyof M>) {
        const storeProps = useMappedStores(mapStoresToProps);
        const Wrapped = WrappedComponent as ComponentType<
            Record<string, unknown>
        >;
        return <Wrapped {...props} {...storeProps} />;
    }

    const wrappedName =
        WrappedComponent.displayName || WrappedComponent.name || 'Component';
    ConnectedComponent.displayName = `connectStore(${wrappedName})`;

    return ConnectedComponent;
}
