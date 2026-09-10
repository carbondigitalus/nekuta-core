import {
    computed,
    effectScope,
    isComputed,
    isReactive,
    isRef,
    reactive,
    toRefs
} from '../reactivity';
import type { Nekuta } from './createNekuta';
import { mergeReactiveObjects } from './patch';
import { applyPlugins } from './plugins';
import { getActiveNekuta } from './rootInstance';
import {
    addSubscription,
    triggerSubscriptions,
    watchState
} from './subscriptions';
import type {
    ActionListener,
    ActionListenerContext,
    DefineStoreOptions,
    DeepPartial,
    StateTree,
    Store,
    StoreDefinition,
    StoreGeneric,
    SubscriptionCallback,
    SubscriptionOptions,
    _ActionsTree,
    _GettersTree
} from './types';

function wrapAction(
    name: string,
    action: (...args: unknown[]) => unknown,
    store: StoreGeneric,
    actionSubscriptions: ActionListener[]
) {
    return function (this: unknown, ...args: unknown[]): unknown {
        let afterCallback: ((result: unknown) => void) | undefined;
        let onErrorCallback: ((error: unknown) => void) | undefined;

        triggerSubscriptions(actionSubscriptions, {
            name,
            store,
            args,
            after: (callback: (result: unknown) => void) => {
                afterCallback = callback;
            },
            onError: (callback: (error: unknown) => void) => {
                onErrorCallback = callback;
            }
        } as ActionListenerContext);

        let result: unknown;
        try {
            result = action.apply(this, args);
        } catch (error) {
            onErrorCallback?.(error);
            throw error;
        }

        if (result instanceof Promise) {
            return result
                .then((value) => {
                    afterCallback?.(value);
                    return value;
                })
                .catch((error: unknown) => {
                    onErrorCallback?.(error);
                    throw error;
                });
        }

        afterCallback?.(result);
        return result;
    };
}

function createSetupStore<
    Id extends string,
    S extends StateTree,
    G extends _GettersTree<S>,
    A extends _ActionsTree
>(
    id: Id,
    setup: () => Record<string, unknown>,
    nekuta: Nekuta,
    isOptionsStore: boolean,
    optionsForPlugins: DefineStoreOptions<Id, S, G, A>
): Store<Id, S, G, A> {
    const storeScope = effectScope();
    const subscriptions: SubscriptionCallback<S>[] = [];
    const actionSubscriptions: ActionListener[] = [];
    let isPatching = false;

    if (!nekuta.state.value[id]) {
        nekuta.state.value[id] = {};
    }

    function $patch(
        partialStateOrMutator: DeepPartial<S> | ((state: S) => void)
    ): void {
        isPatching = true;
        let mutationType: 'patch object' | 'patch function';

        if (typeof partialStateOrMutator === 'function') {
            (partialStateOrMutator as (state: S) => void)(
                nekuta.state.value[id] as S
            );
            mutationType = 'patch function';
        } else {
            mergeReactiveObjects(
                nekuta.state.value[id] as StateTree,
                partialStateOrMutator as DeepPartial<StateTree>
            );
            mutationType = 'patch object';
        }

        isPatching = false;
        triggerSubscriptions(
            subscriptions,
            { type: mutationType, storeId: id },
            nekuta.state.value[id] as S
        );
    }

    function $reset(): void {
        if (!isOptionsStore) {
            throw new Error(
                `nekuta: store "${id}" is built using the setup syntax and does not implement $reset().`
            );
        }

        const newState = (optionsForPlugins.state ?? (() => ({}) as S))();
        $patch((state) => {
            Object.assign(state as object, newState);
        });
    }

    function $subscribe(
        callback: SubscriptionCallback<S>,
        options: SubscriptionOptions = {}
    ): () => void {
        return addSubscription(subscriptions, callback, options.detached, () =>
            stopWatcher()
        );
    }

    function $onAction(callback: ActionListener): () => void {
        return addSubscription(actionSubscriptions, callback);
    }

    function $dispose(): void {
        storeScope.stop();
        subscriptions.length = 0;
        actionSubscriptions.length = 0;
        nekuta._s.delete(id);
    }

    const stopWatcher = storeScope.run(() =>
        watchState(
            () => nekuta.state.value[id],
            () => {
                if (!isPatching) {
                    triggerSubscriptions(
                        subscriptions,
                        { type: 'direct', storeId: id },
                        nekuta.state.value[id] as S
                    );
                }
            }
        )
    ) as () => void;

    const partialStore = {
        $id: id,
        $onAction,
        $patch,
        $reset,
        $subscribe,
        $dispose
    } as unknown as StoreGeneric;

    Object.defineProperty(partialStore, '$state', {
        enumerable: false,
        get: () => nekuta.state.value[id],
        set: (newState: S) => {
            $patch((state) => Object.assign(state as object, newState));
        }
    });

    const store = reactive(partialStore) as unknown as StoreGeneric;
    nekuta._s.set(id, store);

    const setupStoreResult = storeScope.run(setup) as Record<string, unknown>;

    for (const key of Object.keys(setupStoreResult)) {
        const prop = setupStoreResult[key];

        if (isComputed(prop)) {
            // A getter — lives on the store only; it's derived, not source-of-truth state, so it
            // must NOT be folded into the state tree (checked first since a computed is now also
            // isRef() — real refs/reactive state falls through to the branch below).
            (store as unknown as StateTree)[key] = prop;
        } else if (isRef(prop) || isReactive(prop)) {
            if (
                !isOptionsStore &&
                !(key in (nekuta.state.value[id] as StateTree))
            ) {
                (nekuta.state.value[id] as StateTree)[key] = prop;
            }
            (store as unknown as StateTree)[key] = prop;
        } else if (typeof prop === 'function') {
            (store as unknown as StateTree)[key] = wrapAction(
                key,
                prop as (...args: unknown[]) => unknown,
                store,
                actionSubscriptions
            );
        } else {
            (store as unknown as StateTree)[key] = prop;
        }
    }

    applyPlugins(nekuta, store, optionsForPlugins);

    return store as unknown as Store<Id, S, G, A>;
}

function createOptionsStore<
    Id extends string,
    S extends StateTree,
    G extends _GettersTree<S>,
    A extends _ActionsTree
>(
    id: Id,
    options: DefineStoreOptions<Id, S, G, A>,
    nekuta: Nekuta
): Store<Id, S, G, A> {
    const { state, getters, actions } = options;

    function setup(): Record<string, unknown> {
        // `nekuta.state.value[id]` was already pre-seeded to `{}` by createSetupStore before this
        // runs, so a `!nekuta.state.value[id]` guard here would never fire (`{}` is truthy) and
        // `state()`'s result would never actually get written. But a blind `Object.assign` isn't
        // right either — it would clobber state a Next.js adapter already hydrated here (via
        // hydrateNekutaState()) before this store was first resolved. Only fill in keys that
        // aren't already present.
        const existingState = nekuta.state.value[id] as StateTree;
        const defaultState = state ? state() : ({} as S);
        for (const key of Object.keys(defaultState)) {
            if (!(key in existingState)) {
                existingState[key] = (defaultState as StateTree)[key];
            }
        }

        const localState = reactive(
            nekuta.state.value[id] as object
        ) as unknown as S;

        // `toRefs()`, not a plain spread — each key must stay LIVE-linked back to
        // `nekuta.state.value[id]` (a plain `{...localState}` would copy today's primitive
        // values once and never touch the real state tree again, breaking $patch/$subscribe/$state).
        const setupResult: Record<string, unknown> = toRefs(localState);

        for (const key of Object.keys(getters ?? {})) {
            const getter = (getters as _GettersTree<S>)[key];
            setupResult[key] = computed(() => {
                const currentStore = nekuta._s.get(id) as unknown as S &
                    Record<string, unknown>;
                return getter.call(currentStore, currentStore as unknown as S);
            });
        }

        for (const key of Object.keys(actions ?? {})) {
            setupResult[key] = (actions as A)[key];
        }

        return setupResult;
    }

    return createSetupStore(id, setup, nekuta, true, options);
}

export function defineStore<
    Id extends string,
    S extends StateTree = StateTree,
    G extends _GettersTree<S> = _GettersTree<S>,
    A extends _ActionsTree = _ActionsTree
>(options: DefineStoreOptions<Id, S, G, A>): StoreDefinition<Id, S, G, A>;
export function defineStore<
    Id extends string,
    SetupReturn extends Record<string, unknown>
>(
    id: Id,
    setup: () => SetupReturn
): StoreDefinition<Id, StateTree, _GettersTree<StateTree>, _ActionsTree>;
export function defineStore(
    idOrOptions:
        | string
        | DefineStoreOptions<
              string,
              StateTree,
              _GettersTree<StateTree>,
              _ActionsTree
          >,
    setup?: () => Record<string, unknown>
): StoreDefinition {
    const isOptionsStore = typeof idOrOptions !== 'string';
    const id = isOptionsStore ? idOrOptions.id : idOrOptions;

    function useStore(nekuta?: Nekuta): StoreGeneric {
        const activeNekuta = nekuta ?? getActiveNekuta();
        if (!activeNekuta) {
            throw new Error(
                `nekuta: no active Nekuta instance found. Call setActiveNekuta() (or, in React, render a <NekutaProvider>) before calling "${id}"'s store accessor.`
            );
        }

        let store = activeNekuta._s.get(id);
        if (!store) {
            store = isOptionsStore
                ? (createOptionsStore(
                      id,
                      idOrOptions as DefineStoreOptions<
                          string,
                          StateTree,
                          _GettersTree<StateTree>,
                          _ActionsTree
                      >,
                      activeNekuta
                  ) as StoreGeneric)
                : (createSetupStore(id, setup!, activeNekuta, false, {
                      id
                  }) as StoreGeneric);
        }

        return store;
    }

    useStore.$id = id;

    return useStore as StoreDefinition;
}
