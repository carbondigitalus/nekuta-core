import type { Nekuta } from './createNekuta';
import type {
    DefineStoreOptions,
    StateTree,
    StoreGeneric,
    _ActionsTree,
    _GettersTree
} from './types';

export function applyPlugins<Id extends string, S extends StateTree>(
    nekuta: Nekuta,
    store: StoreGeneric,
    options: DefineStoreOptions<Id, S, _GettersTree<S>, _ActionsTree>
): void {
    for (const plugin of nekuta._p) {
        const extensions = plugin({
            store,
            nekuta,
            options: options as unknown as DefineStoreOptions<
                string,
                StateTree,
                _GettersTree<StateTree>,
                _ActionsTree
            >
        });

        if (extensions) {
            Object.assign(store, extensions);
        }
    }
}
