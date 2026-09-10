import { defineStore } from '@nekuta/core';

export const useCounterStore = defineStore({
    id: 'counter',
    state: () => ({ count: 0 }),
    getters: {
        doubleCount: (state) => state.count * 2
    },
    actions: {
        increment(this: { count: number }, by = 1) {
            this.count += by;
        },
        decrement(this: { count: number }, by = 1) {
            this.count -= by;
        },
        reset(this: { count: number }) {
            this.count = 0;
        }
    }
});
