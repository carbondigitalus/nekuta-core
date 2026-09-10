'use client';

import type { Component, ComponentType } from 'react';
import { ReactiveEffect, resetEffectTracking } from '../reactivity/index.js';
import {
    getActiveNekuta,
    type NekutaInstance,
    type StoreGeneric
} from '../store/index.js';
import { NekutaContext } from './context.js';
import { createTrackedProxy } from './trackedProxy.js';

export type MapStoresToProps = Record<
    string,
    (nekuta?: NekutaInstance) => StoreGeneric
>;

export type MappedStores<M extends MapStoresToProps> = {
    [K in keyof M]: ReturnType<M[K]>;
};

const EFFECT = Symbol('nekuta.connectStore.effect');
const NEEDS_RESET = Symbol('nekuta.connectStore.needsReset');

interface ConnectedInstance {
    context?: NekutaInstance;
    forceUpdate(): void;
    [EFFECT]?: ReactiveEffect;
    [NEEDS_RESET]?: boolean;
}

type Lifecycle =
    'componentDidMount' | 'componentDidUpdate' | 'componentWillUnmount';

function wrapLifecycle(
    prototype: Record<string, unknown>,
    name: Lifecycle,
    addition: (this: ConnectedInstance) => void
): void {
    const original = prototype[name] as
        ((...args: unknown[]) => void) | undefined;

    prototype[name] = function (this: ConnectedInstance, ...args: unknown[]) {
        original?.apply(this, args);
        addition.call(this);
    };
}

function scheduleTrackingReset(this: ConnectedInstance): void {
    this[NEEDS_RESET] = true;
}

function stopEffect(this: ConnectedInstance): void {
    this[EFFECT]?.stop();
}

/**
 * Class-component support: patches `TargetComponent`'s own prototype in place — adding a `store`
 * getter and wrapping `componentDidMount`/`componentDidUpdate`/`componentWillUnmount` — rather than
 * wrapping it in a HOC. `TargetComponent` keeps extending `React.Component` directly; nothing about
 * its base class or component identity changes, and no wrapper component is added to the tree.
 * Returns the SAME class it was given.
 *
 * TypeScript can't see a prototype patch, though: a class's own body is type-checked before
 * `connectStore()` ever runs on it, so nothing done to the class afterward can retroactively teach
 * its `render()` what `this.store` looks like. A `declare` field is the cheapest way around that —
 * compile-time only, erased entirely at runtime.
 *
 * The store map itself can live in either of two places — whichever reads better for a given
 * component — as long as the actual list of stores is written exactly once and everything else
 * just references it via `typeof`:
 *
 * ```tsx
 * // Option 1: a `static stores` on the class itself — connectStore(Component) alone.
 * class Counter extends Component<Props> {
 *     static stores = { counter: useCounterStore };
 *     declare store: MappedStores<typeof Counter.stores>;
 *     render() { const { counter } = this.store; ... }
 * }
 * export default connectStore(Counter);
 *
 * // Option 2: a free-standing const above the class — connectStore(storeMap, Component).
 * const storeMap = { counter: useCounterStore };
 * class Counter extends Component<Props> {
 *     declare store: MappedStores<typeof storeMap>;
 *     render() { const { counter } = this.store; ... }
 * }
 * export default connectStore(storeMap, Counter);
 * ```
 */
export function connectStore<
    C extends ComponentType<any> & { stores: MapStoresToProps }
>(TargetComponent: C): C;
export function connectStore<
    M extends MapStoresToProps,
    C extends ComponentType<any>
>(mapStoresToProps: M, TargetComponent: C): C;
export function connectStore(
    mapStoresToPropsOrComponent: MapStoresToProps | ComponentType<any>,
    maybeTargetComponent?: ComponentType<any>
): ComponentType<any> {
    // A store map is always a plain object; a class/function component is always a function —
    // reliable enough to tell the two call shapes apart without an explicit argument count check.
    const usingStaticStores = typeof mapStoresToPropsOrComponent === 'function';

    const TargetComponent = (
        usingStaticStores ? mapStoresToPropsOrComponent : maybeTargetComponent
    ) as ComponentType<any>;
    const ComponentClass = TargetComponent as unknown as {
        name?: string;
        contextType?: unknown;
        stores?: MapStoresToProps;
    };

    const mapStoresToProps = usingStaticStores
        ? ComponentClass.stores
        : (mapStoresToPropsOrComponent as MapStoresToProps);

    if (!mapStoresToProps) {
        throw new Error(
            `nekuta: connectStore(${ComponentClass.name ?? 'Component'}) was called with no store map and no "static stores" on the class. Either add "static stores = {...}" to the class or call connectStore(storeMap, ${ComponentClass.name ?? 'Component'}).`
        );
    }

    const prototype = (TargetComponent as unknown as { prototype: Component })
        .prototype as Component & Record<string, unknown>;

    if (process.env.NODE_ENV !== 'production') {
        if (
            ComponentClass.contextType &&
            ComponentClass.contextType !== NekutaContext
        ) {
            console.error(
                `nekuta: connectStore() sets "${ComponentClass.name ?? 'Component'}".contextType to resolve the active Nekuta instance, overwriting a contextType it already had. A class component can only consume one Context via contextType — read the other one via a <Context.Consumer> inside render() instead.`
            );
        }
        if (Object.getOwnPropertyDescriptor(prototype, 'store')) {
            console.error(
                `nekuta: "${ComponentClass.name ?? 'Component'}" already defines its own "store" — connectStore() is overwriting it.`
            );
        }
    }

    ComponentClass.contextType = NekutaContext;

    Object.defineProperty(prototype, 'store', {
        configurable: true,
        get(this: ConnectedInstance): Record<string, StoreGeneric> {
            let effect = this[EFFECT];
            if (!effect) {
                effect = new ReactiveEffect(
                    () => {},
                    () => this.forceUpdate()
                );
                this[EFFECT] = effect;
            }

            if (this[NEEDS_RESET] !== false) {
                resetEffectTracking(effect);
                this[NEEDS_RESET] = false;
            }

            const nekuta = this.context ?? getActiveNekuta();
            if (!nekuta) {
                throw new Error(
                    'nekuta: no active Nekuta instance found for a connectStore()-connected component. Wrap your app in <NekutaStore> (or call setActiveNekuta() before rendering).'
                );
            }

            const stores: Record<string, StoreGeneric> = {};
            for (const key of Object.keys(mapStoresToProps)) {
                stores[key] = mapStoresToProps[key](nekuta);
            }

            return createTrackedProxy(stores, effect);
        }
    });

    wrapLifecycle(prototype, 'componentDidMount', scheduleTrackingReset);
    wrapLifecycle(prototype, 'componentDidUpdate', scheduleTrackingReset);
    wrapLifecycle(prototype, 'componentWillUnmount', stopEffect);

    return TargetComponent;
}
