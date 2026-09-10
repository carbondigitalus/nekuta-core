import type { ReactiveEffect } from './effect.js';

export type Dep = Set<ReactiveEffect>;

export function createDep(effects?: ReactiveEffect[]): Dep {
    return new Set<ReactiveEffect>(effects);
}

export const ITERATE_KEY = Symbol('nekuta:iterate');
export const MAP_KEY_ITERATE_KEY = Symbol('nekuta:map-key-iterate');
