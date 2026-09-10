import { getActiveNekuta } from '@nekuta/core';
import { withNekutaSSR } from '@nekuta/next';
import type { InferGetServerSidePropsType } from 'next';
import Link from 'next/link';
import { ActivityLog } from '../../components/ActivityLog';
import { CounterDemo } from '../../components/CounterDemo';
import { TodoDemo } from '../../components/TodoDemo';
import { useCounterStore } from '../../stores/counterStore';
import { useTodoStore } from '../../stores/todoStore';

export const getServerSideProps = withNekutaSSR(async () => {
    // Demonstrates touching stores during actual SSR data-fetching — withNekutaSSR() has already
    // made a fresh Nekuta instance active for this request by the time this runs.
    const nekuta = getActiveNekuta();
    useCounterStore(nekuta);
    useTodoStore(nekuta);

    return { props: {} };
});

export default function PagesDemoPage(
    _props: InferGetServerSidePropsType<typeof getServerSideProps>
) {
    return (
        <main>
            <p>
                <Link href="/">← home</Link>
            </p>
            <h1>Pages Router demo</h1>
            <p>
                getServerSideProps is wrapped with withNekutaSSR(), which
                serializes state onto pageProps.__NEKUTA_STATE__ for
                _app.tsx&apos;s NekutaAppProvider to hydrate.
            </p>
            <CounterDemo />
            <TodoDemo />
            <ActivityLog />
        </main>
    );
}
