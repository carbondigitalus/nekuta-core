import {
    ITERATE_KEY,
    MAP_KEY_ITERATE_KEY,
    createDep,
    type Dep
} from './dep.js';
import { recordEffectScope } from './effectScope.js';
import {
    TriggerOpTypes,
    type DebuggerEventExtraInfo,
    type TrackOpTypes
} from './operations.js';
import { isArray, isIntegerKey, isMap } from './shared.js';

export type EffectScheduler = (...args: unknown[]) => void;

const effectStack: ReactiveEffect[] = [];
let activeEffect: ReactiveEffect | undefined;

export class ReactiveEffect<T = unknown> {
    active = true;
    deps: Dep[] = [];
    /** Set by computed() so trigger() can run computed effects before their dependents — a marker, never read. */
    computed?: unknown;
    allowRecurse?: boolean;
    onStop?: () => void;
    onTrack?: (event: DebuggerEventExtraInfo) => void;
    onTrigger?: (event: DebuggerEventExtraInfo) => void;

    constructor(
        public fn: () => T,
        public scheduler: EffectScheduler | null = null
    ) {
        recordEffectScope(this);
    }

    run(): T {
        if (!this.active) {
            return this.fn();
        }

        cleanupEffect(this);

        const prevEffect = activeEffect;
        effectStack.push(this);
        activeEffect = this;

        try {
            return this.fn();
        } finally {
            effectStack.pop();
            activeEffect = prevEffect;
        }
    }

    stop(): void {
        if (this.active) {
            cleanupEffect(this);
            this.onStop?.();
            this.active = false;
        }
    }
}

function cleanupEffect(effect: ReactiveEffect): void {
    const { deps } = effect;

    for (const dep of deps) {
        dep.delete(effect);
    }

    deps.length = 0;
}

export interface ReactiveEffectRunner<T = unknown> {
    (): T;
    effect: ReactiveEffect<T>;
}

export function effect<T>(
    fn: () => T,
    scheduler?: EffectScheduler
): ReactiveEffectRunner<T> {
    const _effect = new ReactiveEffect(fn, scheduler ?? null);
    _effect.run();

    const runner = _effect.run.bind(_effect) as ReactiveEffectRunner<T>;
    runner.effect = _effect;
    return runner;
}

export function stop(runner: ReactiveEffectRunner): void {
    runner.effect.stop();
}

export function getCurrentEffect(): ReactiveEffect | undefined {
    return activeEffect;
}

const targetMap = new WeakMap<object, Map<unknown, Dep>>();

export function track(target: object, type: TrackOpTypes, key: unknown): void {
    if (!activeEffect) {
        return;
    }

    let depsMap = targetMap.get(target);
    if (!depsMap) {
        targetMap.set(target, (depsMap = new Map()));
    }

    let dep = depsMap.get(key);
    if (!dep) {
        depsMap.set(key, (dep = createDep()));
    }

    trackEffects(dep, target, type, key);
}

export function trackEffects(
    dep: Dep,
    target?: object,
    type?: TrackOpTypes,
    key?: unknown
): void {
    if (!activeEffect || dep.has(activeEffect)) {
        return;
    }

    dep.add(activeEffect);
    activeEffect.deps.push(dep);

    if (activeEffect.onTrack && target && type) {
        activeEffect.onTrack({ target, type, key });
    }
}

export function trigger(
    target: object,
    type: TriggerOpTypes,
    key?: unknown,
    newValue?: unknown,
    oldValue?: unknown
): void {
    const depsMap = targetMap.get(target);
    if (!depsMap) {
        return;
    }

    const keysToTrigger = new Set<unknown>();
    if (key !== undefined) {
        keysToTrigger.add(key);
    }

    switch (type) {
        case TriggerOpTypes.ADD:
            if (!isArray(target)) {
                keysToTrigger.add(ITERATE_KEY);
                if (isMap(target)) {
                    keysToTrigger.add(MAP_KEY_ITERATE_KEY);
                }
            } else if (isIntegerKey(key)) {
                keysToTrigger.add('length');
            }
            break;
        case TriggerOpTypes.DELETE:
            if (!isArray(target)) {
                keysToTrigger.add(ITERATE_KEY);
                if (isMap(target)) {
                    keysToTrigger.add(MAP_KEY_ITERATE_KEY);
                }
            }
            break;
        case TriggerOpTypes.SET:
            // Conservative: a Map value-set also invalidates forEach()-style iteration effects.
            if (isMap(target)) {
                keysToTrigger.add(ITERATE_KEY);
            }
            break;
    }

    const effects = new Set<ReactiveEffect>();
    keysToTrigger.forEach((k) =>
        depsMap.get(k)?.forEach((effect) => effects.add(effect))
    );

    // Setting an array's `length` directly implicitly drops any tracked index >= the new length.
    if (key === 'length' && isArray(target)) {
        const newLength = Number(newValue);
        depsMap.forEach((dep, depKey) => {
            if (
                depKey === 'length' ||
                (typeof depKey !== 'symbol' && Number(depKey) >= newLength)
            ) {
                dep.forEach((effect) => effects.add(effect));
            }
        });
    }

    triggerEffects(effects, { target, type, key, newValue, oldValue });
}

/** Used for Map/Set `.clear()`, which invalidates every effect that ever read from the target. */
export function triggerAll(target: object): void {
    const depsMap = targetMap.get(target);
    if (!depsMap) {
        return;
    }

    const effects = new Set<ReactiveEffect>();
    depsMap.forEach((dep) => dep.forEach((effect) => effects.add(effect)));
    triggerEffects(effects, { target, type: TriggerOpTypes.CLEAR });
}

export function triggerEffects(
    dep: Dep | Set<ReactiveEffect>,
    extraInfo?: DebuggerEventExtraInfo
): void {
    const computedEffects: ReactiveEffect[] = [];
    const regularEffects: ReactiveEffect[] = [];

    for (const effect of dep) {
        if (effect === activeEffect && !effect.allowRecurse) {
            continue;
        }
        (effect.computed ? computedEffects : regularEffects).push(effect);
    }

    // Computed effects run first so their dirty flag flips before dependents re-read `.value`.
    for (const effect of computedEffects) {
        runTriggeredEffect(effect, extraInfo);
    }
    for (const effect of regularEffects) {
        runTriggeredEffect(effect, extraInfo);
    }
}

function runTriggeredEffect(
    effect: ReactiveEffect,
    extraInfo?: DebuggerEventExtraInfo
): void {
    if (effect.onTrigger && extraInfo) {
        effect.onTrigger(extraInfo);
    }

    if (effect.scheduler) {
        effect.scheduler();
    } else {
        effect.run();
    }
}
