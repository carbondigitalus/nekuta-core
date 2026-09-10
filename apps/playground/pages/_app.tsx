import { NekutaAppProvider } from '@nekuta/next';
import type { AppProps } from 'next/app';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
    return (
        <NekutaAppProvider pageProps={pageProps}>
            <Component {...pageProps} />
        </NekutaAppProvider>
    );
}
