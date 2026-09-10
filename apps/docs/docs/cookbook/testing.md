---
sidebar_position: 1
---

# Testing

There's no `createTestingPinia()`-equivalent in Nekuta — no dedicated testing package at all. Stores are plain objects built on a `Nekuta` instance, so testing them is just... testing them, directly, with whatever test runner your app already uses (these examples use Jest).

## Testing a store headlessly

No React needed for this — create an instance, resolve the store against it, assert:

```ts
import { createNekuta } from '@nekuta/core';
import { useCounterStore } from './counterStore';

describe('counterStore', () => {
    it('increments', () => {
        const nekuta = createNekuta();
        const counter = useCounterStore(nekuta);

        counter.increment();

        expect(counter.count).toBe(1);
    });
});
```

Creating a fresh `Nekuta` instance per test gives full isolation for free — nothing to reset between tests, no shared module-level state to worry about.

## Testing a component that uses a store

Wrap it in a real `<NekutaStore>`, same as your app does, and use `@testing-library/react`:

```tsx
import { createNekuta, NekutaStore } from '@nekuta/core';
import { render, screen, act } from '@testing-library/react';
import { Counter } from './Counter';

function renderCounter() {
    const nekuta = createNekuta();
    return render(
        <NekutaStore nekuta={nekuta}>
            <Counter />
        </NekutaStore>
    );
}

it('increments on click', () => {
    renderCounter();

    act(() => {
        screen.getByText('+1').click();
    });

    expect(screen.getByTestId('count')).toHaveTextContent('1');
});
```

Wrap state-changing interactions in `act()` — React 19 needs it to flush the resulting update before your assertion runs, the same as testing any other hook-driven component.

## Stubbing actions

There's no built-in action-stubbing helper — reach for your test runner's own mocking, directly on the store:

```ts
const counter = useCounterStore(nekuta);
jest.spyOn(counter, 'increment').mockImplementation(() => {});
```

## Testing `$subscribe()`/`$onAction()`

Both are just callbacks — pass a `jest.fn()` and assert on it:

```ts
const listener = jest.fn();
counter.$subscribe(listener);

counter.count++;

expect(listener).toHaveBeenCalledTimes(1);
expect(listener.mock.calls[0][0]).toMatchObject({ type: 'direct' });
```
