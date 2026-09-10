import { defineStore } from '@nekuta/core';

export interface TodoItem {
    id: number;
    text: string;
    done: boolean;
}

// A plain object literal, not a named `interface` return-annotated on state() — defineStore()
// needs to infer S structurally from what state() returns so the rest of the options (getters'
// `state` parameter, actions' `this`) narrow to it; annotating the factory's return type with a
// separately-declared interface defeats that inference the same way passing a concrete Store<...>
// into something expecting Record<string, unknown> does (see store/types.ts's own notes on this).
type TodoState = ReturnType<typeof createInitialTodoState>;

function createInitialTodoState() {
    return { items: [] as TodoItem[], nextId: 1 };
}

export const useTodoStore = defineStore({
    id: 'todos',
    state: createInitialTodoState,
    getters: {
        remainingCount: (state) =>
            state.items.filter((item) => !item.done).length,
        completedCount: (state) =>
            state.items.filter((item) => item.done).length
        // A getter CAN call another store's bare accessor (`useCounterStore()`) to combine
        // cross-store state, the same pattern Pinia supports — but that accessor resolves via the
        // module-level active-instance singleton (there's no React Context to read from inside a
        // plain computed getter), which real usage against Next's App Router proved unreliable:
        // its streaming render doesn't keep a synchronously-set singleton "active" by the time a
        // nested Client Component's render actually reads the getter. See TodoDemo.tsx for the
        // safer alternative used here instead — combine multiple stores at the COMPONENT level via
        // two separate useStore() calls, which resolve via Context and work everywhere.
    },
    actions: {
        addTodo(this: TodoState, text: string) {
            const trimmed = text.trim();
            if (!trimmed) {
                return;
            }
            this.items.push({ id: this.nextId++, text: trimmed, done: false });
        },
        toggleTodo(this: TodoState, id: number) {
            const item = this.items.find((todo) => todo.id === id);
            if (item) {
                item.done = !item.done;
            }
        },
        removeTodo(this: TodoState, id: number) {
            this.items = this.items.filter((todo) => todo.id !== id);
        },
        // $patch with a mutator function, in one batched notification instead of N.
        clearCompleted(
            this: TodoState & {
                $patch: (mutator: (state: TodoState) => void) => void;
            }
        ) {
            this.$patch((state) => {
                state.items = state.items.filter((todo) => !todo.done);
            });
        }
    }
});
