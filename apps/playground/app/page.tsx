import Link from 'next/link';

export default function HomePage() {
    return (
        <main>
            <h1>Nekuta Playground</h1>
            <p>
                A React store ecosystem based on Vue&apos;s Pinia store — this
                app dogfoods the same stores through both Next.js routers.
            </p>
            <nav>
                <Link href="/app-demo">App Router demo</Link>
                <Link href="/pages-demo">Pages Router demo</Link>
            </nav>
        </main>
    );
}
