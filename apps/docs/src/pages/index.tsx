// NPM Modules
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import CodeBlock from '@theme/CodeBlock';
import React from 'react';

// Custom Modules
import { NekutaLogoAnimated } from '../components/NekutaLogoAnimated';
import styles from './index.module.scss';

interface Feature {
    icon: string;
    title: string;
    description: string;
}

const FEATURES: Feature[] = [
    {
        icon: '💡',
        title: 'Intuitive',
        description:
            "The same defineStore() shape Pinia users already know — state, getters, and actions, or a setup-style function. If you already think in stores, there's nothing new to learn."
    },
    {
        icon: '🔑',
        title: 'Type Safe',
        description:
            'End-to-end TypeScript inference, from defineStore() through useStore() and connectStore() — no manual generics, no casting, no drift between the store and the component reading it.'
    },
    {
        icon: '🎯',
        title: 'Fine-Grained Reactivity',
        description:
            'A real Proxy-based reactivity engine, not manual selectors. Components re-render only for the exact — even deeply nested — properties they actually read.'
    },
    {
        icon: '🏛',
        title: 'Class Components, First-Class',
        description:
            'connectStore() patches your class in place — no wrapper component, no giving up React.Component. Hooks were never the only way in.'
    },
    {
        icon: '⚡',
        title: 'SSR-Ready',
        description:
            '@nekuta/next handles both the Pages Router and the App Router, with per-request state isolation already solved — not left for you to get right.'
    },
    {
        icon: '📦',
        title: 'Schema or Hooks — Your Choice',
        description:
            "Two equivalent ways to define a store, converging on one engine. Mix freely, or enforce one project-wide with @nekuta/eslint-plugin — it's up to you."
    }
];

const QUICK_START_CODE = `import { defineStore } from '@nekuta/core';

export const useCounterStore = defineStore({
    id: 'counter',
    state: () => ({ count: 0 }),
    getters: {
        doubleCount: (state) => state.count * 2
    },
    actions: {
        increment(this: { count: number }) {
            this.count++;
        }
    }
});

// anywhere in a function component
const counter = useStore(useCounterStore);
counter.count; // 0 — reactive, fine-grained re-renders`;

function HomepageHero() {
    return (
        <header className={styles.hero}>
            <div className={styles.heroGlow} aria-hidden="true" />
            <div className={`container ${styles.heroInner}`}>
                <div className={styles.heroText}>
                    <p className={styles.eyebrow}>ネクター</p>
                    <h1 className={styles.title}>Nekutā</h1>
                    <p className={styles.tagline}>
                        Intuitive state management for React.
                    </p>
                    <p className={styles.subtagline}>
                        Type-safe. Predictable. Class-first.
                    </p>
                    <div className={styles.buttons}>
                        <Link
                            className="button button--primary button--lg"
                            to="/docs/getting-started/installation"
                        >
                            Get Started
                        </Link>
                        <Link
                            className="button button--secondary button--lg"
                            to="https://github.com/jared-leddy/nekuta-core"
                        >
                            View on GitHub
                        </Link>
                    </div>
                </div>
                <div className={styles.heroMascot}>
                    <NekutaLogoAnimated size={280} />
                </div>
            </div>
        </header>
    );
}

function FeatureCard({ icon, title, description }: Feature) {
    return (
        <div className={styles.featureCard}>
            <span className={styles.featureIcon} aria-hidden="true">
                {icon}
            </span>
            <h3 className={styles.featureTitle}>{title}</h3>
            <p className={styles.featureDescription}>{description}</p>
        </div>
    );
}

function FeatureGrid() {
    return (
        <section className={styles.features}>
            <div className="container">
                <div className={styles.featureGrid}>
                    {FEATURES.map((feature) => (
                        <FeatureCard key={feature.title} {...feature} />
                    ))}
                </div>
            </div>
        </section>
    );
}

function QuickLook() {
    return (
        <section className={styles.quickLook}>
            <div className="container">
                <div className={styles.quickLookInner}>
                    <div className={styles.quickLookCopy}>
                        <h2>The same store, either side of your app</h2>
                        <p>
                            Define a store once with <code>defineStore()</code>.
                            Read it from a function component with{' '}
                            <code>useStore()</code>, or from a class component
                            with <code>connectStore()</code> — both fully
                            reactive, both fine-grained, both built on the same
                            engine.
                        </p>
                        <Link
                            className="button button--primary"
                            to="/docs/getting-started/quick-start"
                        >
                            Read the Quick Start →
                        </Link>
                    </div>
                    <div className={styles.quickLookCode}>
                        <CodeBlock language="ts" title="stores/counterStore.ts">
                            {QUICK_START_CODE}
                        </CodeBlock>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default function Home(): React.JSX.Element {
    const { siteConfig } = useDocusaurusContext();
    return (
        <Layout
            title="Nekutā — Intuitive state management for React"
            description={siteConfig.tagline}
        >
            <HomepageHero />
            <main>
                <FeatureGrid />
                <QuickLook />
            </main>
        </Layout>
    );
}
