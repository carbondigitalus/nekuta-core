import { defineStore, getActiveNekuta, setActiveNekuta } from '@nekuta/core';
import type { GetServerSideProps, GetServerSidePropsContext } from 'next';
import { NEKUTA_STATE_PROP, withNekutaSSR } from './withNekutaSSR.js';

const fakeContext = {} as GetServerSidePropsContext;

const useCounterStore = defineStore({
    id: 'counter',
    state: () => ({ count: 0 })
});

afterEach(() => {
    setActiveNekuta(undefined);
});

describe('withNekutaSSR()', () => {
    it('serializes an empty state tree when no getServerSideProps is passed', async () => {
        const wrapped = withNekutaSSR();
        const result = await wrapped(fakeContext);

        expect(result).toMatchObject({ props: { [NEKUTA_STATE_PROP]: {} } });
    });

    it('merges __NEKUTA_STATE__ alongside the wrapped getServerSideProps own props', async () => {
        const gssp: GetServerSideProps<{ greeting: string }> = async () => {
            useCounterStore().count = 7;
            return { props: { greeting: 'hi' } };
        };

        const wrapped = withNekutaSSR(gssp);
        const result = await wrapped(fakeContext);

        expect(result).toMatchObject({
            props: {
                greeting: 'hi',
                [NEKUTA_STATE_PROP]: { counter: { count: 7 } }
            }
        });
    });

    it('makes a fresh Nekuta instance active for the duration of the call, resolvable by defineStore() accessors', async () => {
        let seenDuringCall: unknown;

        const gssp: GetServerSideProps = async () => {
            seenDuringCall = getActiveNekuta();
            return { props: {} };
        };

        const wrapped = withNekutaSSR(gssp);
        await wrapped(fakeContext);

        expect(seenDuringCall).toBeDefined();
        expect(getActiveNekuta()).toBeUndefined();
    });

    it('passes a redirect result through untouched, without a __NEKUTA_STATE__ prop', async () => {
        const gssp: GetServerSideProps = async () => ({
            redirect: { destination: '/login', permanent: false }
        });

        const wrapped = withNekutaSSR(gssp);
        const result = await wrapped(fakeContext);

        expect(result).toEqual({
            redirect: { destination: '/login', permanent: false }
        });
    });

    it('passes a notFound result through untouched', async () => {
        const gssp: GetServerSideProps = async () => ({ notFound: true });

        const wrapped = withNekutaSSR(gssp);
        const result = await wrapped(fakeContext);

        expect(result).toEqual({ notFound: true });
    });

    it('isolates state between two separate requests (calls)', async () => {
        const gssp: GetServerSideProps = async () => {
            useCounterStore().count++;
            return { props: {} };
        };

        const wrapped = withNekutaSSR(gssp);
        const first = await wrapped(fakeContext);
        const second = await wrapped(fakeContext);

        expect(first).toMatchObject({
            props: { [NEKUTA_STATE_PROP]: { counter: { count: 1 } } }
        });
        expect(second).toMatchObject({
            props: { [NEKUTA_STATE_PROP]: { counter: { count: 1 } } }
        });
    });
});
