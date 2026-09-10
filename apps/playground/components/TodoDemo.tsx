'use client';

import { useStore } from '@nekuta/core';
import { useState, type FormEvent } from 'react';
import { useCounterStore } from '../stores/counterStore';
import { useTodoStore } from '../stores/todoStore';

export function TodoDemo() {
    const todos = useStore(useTodoStore);
    // Combining two stores here, at the component level, rather than via a getter calling the
    // other store's bare accessor — see todoStore.ts's note on why that pattern isn't SSR-safe
    // under the App Router. useStore() resolves through Context, which works everywhere.
    const counter = useStore(useCounterStore);
    const [text, setText] = useState('');

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        todos.addTodo(text);
        setText('');
    }

    return (
        <section>
            <h2>Todo store</h2>
            <p>
                remaining: <strong>{todos.remainingCount}</strong> · completed:{' '}
                <strong>{todos.completedCount}</strong> · remaining + counter
                (combined across two stores):{' '}
                <strong>{todos.remainingCount + counter.count}</strong>
            </p>

            <form onSubmit={handleSubmit} className="buttons">
                <input
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    placeholder="Add a todo…"
                />
                <button type="submit">add</button>
                <button type="button" onClick={() => todos.clearCompleted()}>
                    clear completed
                </button>
            </form>

            <ul>
                {todos.items.map((item) => (
                    <li key={item.id}>
                        <label>
                            <input
                                type="checkbox"
                                checked={item.done}
                                onChange={() => todos.toggleTodo(item.id)}
                            />
                            <span
                                style={{
                                    textDecoration: item.done
                                        ? 'line-through'
                                        : 'none'
                                }}
                            >
                                {item.text}
                            </span>
                        </label>
                        <button onClick={() => todos.removeTodo(item.id)}>
                            remove
                        </button>
                    </li>
                ))}
            </ul>
        </section>
    );
}
