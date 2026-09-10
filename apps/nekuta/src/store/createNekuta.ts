import { type EffectScope, effectScope, markRaw, ref } from '../reactivity';
import type {
    NekutaInstance,
    NekutaPlugin,
    StateTree,
    StoreGeneric
} from './types';

export interface Nekuta extends NekutaInstance {
    /** Root effect scope every store's own scope nests under, so `disposeNekuta()` tears down everything at once. */
    _e: EffectScope;
}

export function createNekuta(): Nekuta {
    const scope = effectScope(true);
    const state = scope.run(() => ref<Record<string, StateTree>>({}))!;
    const _s = new Map<string, StoreGeneric>();
    const _p: NekutaPlugin[] = [];

    const nekuta: Nekuta = markRaw({
        _e: scope,
        _s,
        _p,
        state,
        use(plugin: NekutaPlugin) {
            _p.push(plugin);
            return nekuta;
        }
    });

    return nekuta;
}

export function disposeNekuta(nekuta: Nekuta): void {
    nekuta._e.stop();
    nekuta._s.clear();
    nekuta._p.length = 0;
    nekuta.state.value = {};
}
