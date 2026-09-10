import { render, screen } from '@testing-library/react';
import React from 'react';

import Root from '../src/theme/Root';

describe('Root', () => {
    it('renders the floating request button and its children', () => {
        render(
            <Root>
                <div>Child Content</div>
            </Root>
        );

        expect(screen.getByRole('button', { name: '+' })).toBeInTheDocument();
        expect(screen.getByText('Child Content')).toBeInTheDocument();
    });
});
