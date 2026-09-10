import { render, screen } from '@testing-library/react';
import React from 'react';

import Home from '../src/pages/index';

describe('Home', () => {
    it('renders the hero title, tagline, and subtagline', () => {
        render(<Home />);

        expect(
            screen.getByRole('heading', { name: 'Nekutā', level: 1 })
        ).toBeInTheDocument();
        expect(
            screen.getByText('Intuitive state management for React.')
        ).toBeInTheDocument();
        expect(
            screen.getByText('Type-safe. Predictable. Class-first.')
        ).toBeInTheDocument();
    });

    it('passes the page title and description to Layout', () => {
        render(<Home />);

        const layout = screen.getByTestId('layout');
        expect(layout).toHaveAttribute(
            'data-title',
            'Nekutā — Intuitive state management for React'
        );
        expect(layout).toHaveAttribute(
            'data-description',
            'Intuitive state management for React.'
        );
    });

    it('links "Get Started" to the installation guide and "View on GitHub" to the repo', () => {
        render(<Home />);

        expect(
            screen.getByRole('link', { name: 'Get Started' })
        ).toHaveAttribute('href', '/docs/getting-started/installation');
        expect(
            screen.getByRole('link', { name: 'View on GitHub' })
        ).toHaveAttribute('href', 'https://github.com/jared-leddy/nekuta-core');
    });

    it('renders all six feature cards', () => {
        render(<Home />);

        const titles = [
            'Intuitive',
            'Type Safe',
            'Fine-Grained Reactivity',
            'Class Components, First-Class',
            'SSR-Ready',
            'Schema or Hooks — Your Choice'
        ];

        for (const title of titles) {
            expect(
                screen.getByRole('heading', { name: title, level: 3 })
            ).toBeInTheDocument();
        }
    });

    it('renders the quick-look code sample and its own CTA', () => {
        render(<Home />);

        expect(
            screen.getByText('The same store, either side of your app')
        ).toBeInTheDocument();

        const codeBlock = screen.getByTestId('code-block');
        expect(codeBlock).toHaveAttribute(
            'data-title',
            'stores/counterStore.ts'
        );
        expect(codeBlock).toHaveTextContent('defineStore');

        expect(
            screen.getByRole('link', { name: 'Read the Quick Start →' })
        ).toHaveAttribute('href', '/docs/getting-started/quick-start');
    });
});
