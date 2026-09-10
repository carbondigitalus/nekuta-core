import { render, screen } from '@testing-library/react';
import React from 'react';

import Home from '../src/pages/index';

describe('Home', () => {
    it('renders the site title and tagline from the Docusaurus context', () => {
        render(<Home />);

        expect(
            screen.getByRole('heading', { name: 'Nekuta' })
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                'The official docs for our Nekuta stores for React.'
            )
        ).toBeInTheDocument();
    });

    it('passes the page title and description to Layout', () => {
        render(<Home />);

        const layout = screen.getByTestId('layout');
        expect(layout).toHaveAttribute('data-title', 'Docs Home');
        expect(layout).toHaveAttribute(
            'data-description',
            'The official docs for our Nekuta stores for React.'
        );
    });
});
