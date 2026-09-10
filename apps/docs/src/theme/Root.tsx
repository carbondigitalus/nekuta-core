// NPM Modules
import React from 'react';

// Custom Modules
import FloatingRequestButton from '../components/floating-request';

// Default implementation, that you can customize
export default function Root({ children }) {
    return (
        <>
            <FloatingRequestButton />
            {children}
        </>
    );
}
