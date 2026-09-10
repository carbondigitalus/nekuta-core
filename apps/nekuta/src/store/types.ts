import type { ComputedRef, Ref } from '../reactivity/index.js';

export type StateTree = Record<string, unknown>;

export type DeepPartial<T> = T extends (infer U)[]
    ? DeepPartial<U>[]
    : T extends object
      ? { [K in keyof T]?: DeepPartial<T[K]> }
      : T;

/** Getters may read `state` as a parameter and/or `this` (bound to the full store, so getters can reference each other). */
export type _GettersTree<S extends StateTree> = Record<
    string,
    ((state: S) => unknown) | (() => unknown)
>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- constraint position: `never[]` here would block inference of concrete action/getter parameter types at call sites.
export type _ActionsTree = Record<string, (...args: any[]) => unknown>;

export type _GettersResults<
    G extends Record<string, (...args: any[]) => unknown>
> = {
    [K in keyof G]: G[K] extends (...args: any[]) => infer R ? R : never;
};

export type SubscriptionCallbackMutation<S extends StateTree> = {
    type: 'direct' | 'patch object' | 'patch function';
    storeId: string;
    events?: unknown;
};

export type SubscriptionCallback<S extends StateTree> = (
    mutation: SubscriptionCallbackMutation<S>,
    state: S
) => void;

export interface SubscriptionOptions {
    detached?: boolean;
}

export type ActionListenerContext<A extends _ActionsTree = _ActionsTree> = {
    [K in keyof A]: {
        name: K;
        store: StoreGeneric;
        args: Parameters<A[K]>;
        after: (callback: (result: ReturnType<A[K]>) => void) => void;
        onError: (callback: (error: unknown) => void) => void;
    };
}[keyof A];

export type ActionListener = (context: ActionListenerContext) => void;

export interface StoreProperties<Id extends string = string> {
    $id: Id;
}

export type _StoreWithState<
    Id extends string,
    S extends StateTree
> = StoreProperties<Id> &
    S & {
        $state: S;
        $patch(
            partialStateOrMutator: DeepPartial<S> | ((state: S) => void)
        ): void;
        $reset(): void;
        $subscribe(
            callback: SubscriptionCallback<S>,
            options?: SubscriptionOptions
        ): () => void;
        $onAction(callback: ActionListener): () => void;
        $dispose(): void;
    };

export type Store<
    Id extends string = string,
    S extends StateTree = StateTree,
    G extends _GettersTree<S> = _GettersTree<S>,
    A extends _ActionsTree = _ActionsTree
    // The trailing `& Record<string, unknown>` isn't just documentation — TS never synthesizes an
    // implicit index signature for a named-property intersection, so without it a concrete
    // `Store<...>` fails to satisfy anything genuinely requiring `Record<string, unknown>`
    // (storeToRefs()'s generic constraint, a plugin's `Partial<StoreGeneric>` return, etc.),
    // even though every store is structurally one.
> = _StoreWithState<Id, S> & _GettersResults<G> & A & Record<string, unknown>;

/**
 * A type-erased "any store" handle — used where a store's precise Id/State/Getters/Actions
 * shape isn't known (plugins, `$onAction` listeners, `storeToRefs()`). Deliberately NOT
 * `Store<string, StateTree, ..., _ActionsTree>`: intersecting with an index-signature actions
 * type there would force every extra property (including non-function ones a plugin injects)
 * to be callable.
 */
export type StoreGeneric = _StoreWithState<string, StateTree> &
    Record<string, unknown>;

export interface DefineStoreOptions<
    Id extends string,
    S extends StateTree,
    G extends _GettersTree<S>,
    A extends _ActionsTree
> {
    id: Id;
    state?: () => S;
    getters?: G & ThisType<S & _GettersResults<G> & Store<Id, S, G, A>>;
    actions?: A & ThisType<S & _GettersResults<G> & A & Store<Id, S, G, A>>;
}

export type StoreDefinition<
    Id extends string = string,
    S extends StateTree = StateTree,
    G extends _GettersTree<S> = _GettersTree<S>,
    A extends _ActionsTree = _ActionsTree
> = {
    (nekuta?: NekutaInstance): Store<Id, S, G, A>;
    $id: Id;
};

export interface NekutaPluginContext<
    Id extends string = string,
    S extends StateTree = StateTree
> {
    store: StoreGeneric;
    nekuta: NekutaInstance;
    options: DefineStoreOptions<Id, S, _GettersTree<S>, _ActionsTree>;
}

export type NekutaPlugin = (
    context: NekutaPluginContext
) => Partial<StoreGeneric> | void;

export interface NekutaInstance {
    state: Ref<Record<string, StateTree>>;
    _s: Map<string, StoreGeneric>;
    _p: NekutaPlugin[];
    use(plugin: NekutaPlugin): NekutaInstance;
}

export type { ComputedRef, Ref };
