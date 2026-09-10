'use client';

import Link from 'next/link';
import { ActivityLog } from '../../components/ActivityLog';
import { CounterDemo } from '../../components/CounterDemo';
import { TodoDemo } from '../../components/TodoDemo';

export default function AppDemoPage() {
    return (
        <main>
            <p>
                <Link href="/">← home</Link>
            </p>
            <h1>App Router demo</h1>
            <p>
                Server Component root layout creates the Nekuta instance via
                getServerNekuta() and hands it to a Client Component boundary
                (NekutaClientProvider).
            </p>
            <CounterDemo />
            <TodoDemo />
            <ActivityLog />
        </main>
    );
}
