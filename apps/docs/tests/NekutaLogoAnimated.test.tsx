import { act, fireEvent, render } from '@testing-library/react';
import React from 'react';

import { NekutaLogoAnimated } from '../src/components/NekutaLogoAnimated';

function mockMatchMedia(matches: boolean) {
    const listeners = new Set<(event: MediaQueryListEvent) => void>();
    const mql = {
        matches,
        media: '(prefers-reduced-motion: reduce)',
        addEventListener: (
            _type: string,
            listener: (event: MediaQueryListEvent) => void
        ) => listeners.add(listener),
        removeEventListener: (
            _type: string,
            listener: (event: MediaQueryListEvent) => void
        ) => listeners.delete(listener),
        dispatchEvent: () => true
    } as unknown as MediaQueryList;

    window.matchMedia = jest.fn().mockReturnValue(mql);

    return {
        mql,
        emit(nextMatches: boolean) {
            listeners.forEach((listener) => {
                listener({ matches: nextMatches } as MediaQueryListEvent);
            });
        }
    };
}

describe('NekutaLogoAnimated', () => {
    beforeEach(() => {
        // Modern Jest fake timers fake requestAnimationFrame/cancelAnimationFrame
        // natively, tied to the same virtual clock as setTimeout — advancing that
        // clock (jest.advanceTimersByTime) drives animate()'s rAF loop too, no
        // separate rAF mock needed.
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('renders with the default accessible label', () => {
        mockMatchMedia(false);
        const { getByRole } = render(<NekutaLogoAnimated />);

        expect(
            getByRole('img', { name: 'Nekutā mango mascot' })
        ).toBeInTheDocument();
    });

    it('respects a custom label', () => {
        mockMatchMedia(false);
        const { getByRole } = render(<NekutaLogoAnimated label="Custom" />);

        expect(getByRole('img', { name: 'Custom' })).toBeInTheDocument();
    });

    it('marks itself reduced-motion when prefers-reduced-motion matches', () => {
        mockMatchMedia(true);
        const { container } = render(<NekutaLogoAnimated />);

        expect(container.querySelector('svg')).toHaveClass(
            'nekuta-logo--reduced-motion'
        );
    });

    it('adds the hovered class on pointer enter and removes it on pointer leave', () => {
        mockMatchMedia(false);
        const { container } = render(<NekutaLogoAnimated />);
        const svg = container.querySelector('svg')!;

        fireEvent.pointerEnter(svg);
        expect(svg).toHaveClass('nekuta-logo--hovered');

        fireEvent.pointerLeave(svg);
        expect(svg).not.toHaveClass('nekuta-logo--hovered');
    });

    it('does not become hovered when reduced motion is preferred', () => {
        mockMatchMedia(true);
        const { container } = render(<NekutaLogoAnimated />);
        const svg = container.querySelector('svg')!;

        fireEvent.pointerEnter(svg);
        expect(svg).not.toHaveClass('nekuta-logo--hovered');
    });

    it('updates reducedMotion when the media query preference changes after mount', () => {
        const { emit } = mockMatchMedia(false);
        const { container } = render(<NekutaLogoAnimated />);

        act(() => {
            emit(true);
        });

        expect(container.querySelector('svg')).toHaveClass(
            'nekuta-logo--reduced-motion'
        );
    });

    it('cleans up its listeners, animation frame, and timers on unmount', () => {
        mockMatchMedia(false);
        const removeEventListenerSpy = jest.spyOn(
            window,
            'removeEventListener'
        );
        const cancelAnimationFrameSpy = jest.spyOn(
            window,
            'cancelAnimationFrame'
        );
        const clearTimeoutSpy = jest.spyOn(window, 'clearTimeout');

        const { unmount } = render(<NekutaLogoAnimated />);
        unmount();

        expect(removeEventListenerSpy).toHaveBeenCalledWith(
            'pointermove',
            expect.any(Function)
        );
        expect(cancelAnimationFrameSpy).toHaveBeenCalled();
        expect(clearTimeoutSpy).toHaveBeenCalled();

        removeEventListenerSpy.mockRestore();
        cancelAnimationFrameSpy.mockRestore();
        clearTimeoutSpy.mockRestore();
    });

    it('does not attach a pointermove listener when interactive is false', () => {
        mockMatchMedia(false);
        const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

        render(<NekutaLogoAnimated interactive={false} />);

        expect(addEventListenerSpy).not.toHaveBeenCalledWith(
            'pointermove',
            expect.any(Function),
            expect.anything()
        );

        addEventListenerSpy.mockRestore();
    });

    it('toggles blinking on and off on the scheduled timers', () => {
        mockMatchMedia(false);
        const { container } = render(<NekutaLogoAnimated />);

        // scheduleBlink() picks a delay in [2400, 8000)ms, then blinks for 135ms.
        act(() => {
            jest.advanceTimersByTime(8000);
        });
        expect(
            container.querySelector('.nekuta-logo__blink')
        ).toBeInTheDocument();

        act(() => {
            jest.advanceTimersByTime(135);
        });
        expect(
            container.querySelector('.nekuta-logo__blink')
        ).not.toBeInTheDocument();
    });

    it('moves the pupils toward a real pointermove position, clamped to the eye range', () => {
        mockMatchMedia(false);
        const { container } = render(<NekutaLogoAnimated />);
        const svg = container.querySelector('svg')!;

        jest.spyOn(svg, 'getBoundingClientRect').mockReturnValue({
            left: 0,
            top: 0,
            width: 100,
            height: 100,
            right: 100,
            bottom: 100,
            x: 0,
            y: 0,
            toJSON: () => ({})
        });

        // Far outside the tracked range on both axes — clamp() should pin this to (1, 1).
        act(() => {
            fireEvent.pointerMove(window, { clientX: 10_000, clientY: 10_000 });
        });

        // The eyes ease toward the clamped target frame by frame — advancing real
        // time lets that lerp (driven by the mocked rAF loop below) settle.
        act(() => {
            jest.advanceTimersByTime(3000);
        });

        expect(svg.getAttribute('class')).toContain('nekuta-logo');
    });

    it('re-subscribes to pointermove when the interactive prop changes', () => {
        mockMatchMedia(false);
        const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
        const removeEventListenerSpy = jest.spyOn(
            window,
            'removeEventListener'
        );

        const { rerender } = render(<NekutaLogoAnimated interactive={true} />);
        addEventListenerSpy.mockClear();

        rerender(<NekutaLogoAnimated interactive={false} />);
        expect(removeEventListenerSpy).toHaveBeenCalledWith(
            'pointermove',
            expect.any(Function)
        );

        rerender(<NekutaLogoAnimated interactive={true} />);
        expect(addEventListenerSpy).toHaveBeenCalledWith(
            'pointermove',
            expect.any(Function),
            expect.objectContaining({ passive: true })
        );

        addEventListenerSpy.mockRestore();
        removeEventListenerSpy.mockRestore();
    });

    it('reschedules without ever blinking when reduced motion is preferred', () => {
        mockMatchMedia(true);
        const { container } = render(<NekutaLogoAnimated />);

        act(() => {
            jest.advanceTimersByTime(8000);
        });
        expect(
            container.querySelector('.nekuta-logo__blink')
        ).not.toBeInTheDocument();

        act(() => {
            jest.advanceTimersByTime(8000);
        });
        expect(
            container.querySelector('.nekuta-logo__blink')
        ).not.toBeInTheDocument();
    });
});
