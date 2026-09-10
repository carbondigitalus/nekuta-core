import { render, screen } from '@testing-library/react';
import React from 'react';

import FloatingRequestButton from '../src/components/floating-request';

describe('FloatingRequestButton', () => {
    it('renders the toggle button', () => {
        render(<FloatingRequestButton />);

        expect(screen.getByRole('button', { name: '+' })).toBeInTheDocument();
    });
});
