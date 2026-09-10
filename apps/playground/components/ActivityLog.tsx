'use client';

import { useStore } from '@nekuta/core';
import { useEffect, useState } from 'react';
import { useCounterStore } from '../stores/counterStore';
import { useTodoStore } from '../stores/todoStore';

/** Demonstrates $subscribe (state changes) and $onAction (action lifecycle) on two live stores. */
export function ActivityLog() {
    const counter = useStore(useCounterStore);
    const todos = useStore(useTodoStore);
    const [log, setLog] = useState<string[]>([]);

    useEffect(() => {
        function append(line: string) {
            setLog((prev) => [line, ...prev].slice(0, 8));
        }

        const unsubscribeCounterState = counter.$subscribe((mutation) => {
            append(`[$subscribe] counter store changed (${mutation.type})`);
        });
        const unsubscribeCounterAction = counter.$onAction(
            ({ name, after }) => {
                append(`[$onAction] counter.${String(name)} called`);
                after(() =>
                    append(`[$onAction] counter.${String(name)} finished`)
                );
            }
        );
        const unsubscribeTodoAction = todos.$onAction(({ name }) => {
            append(`[$onAction] todos.${String(name)} called`);
        });

        return () => {
            unsubscribeCounterState();
            unsubscribeCounterAction();
            unsubscribeTodoAction();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- counter/todos are stable store references, not values to re-subscribe on
    }, []);

    return (
        <section>
            <h2>Activity log — $subscribe() / $onAction()</h2>
            <ul className="log">
                {log.map((line, index) => (
                    <li key={index}>{line}</li>
                ))}
            </ul>
        </section>
    );
}
