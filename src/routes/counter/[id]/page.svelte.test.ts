import { mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { addCounter } from '$lib/counters/queries';
import { logEntry } from '$lib/entries/queries';
import { resetDatabase } from '$lib/testing/reset-db';

// Hoisted so the mock factory below can reach it, and mutable so each test can point
// the route at the counter it just created.
const routeState = vi.hoisted(() => ({ params: { id: '0' } as Record<string, string> }));
vi.mock('$app/state', () => ({ page: routeState }));

const CounterPage = (await import('./+page.svelte')).default;

const T0 = new Date('2025-06-18T12:00:00-04:00').getTime();

beforeEach(resetDatabase);
afterEach(() => {
	document.body.innerHTML = '';
});

async function waitForText(text: string, timeoutMs = 2000) {
	const deadline = Date.now() + timeoutMs;
	while (!document.body.textContent?.includes(text)) {
		if (Date.now() > deadline) {
			throw new Error(`timed out waiting for "${text}"; saw "${document.body.textContent}"`);
		}
		await new Promise((resolve) => setTimeout(resolve, 5));
	}
}

describe('counter detail page', () => {
	it('renders the counter name from the route id', async () => {
		const id = await addCounter({ name: 'Cat treats' }, T0);
		routeState.params = { id: String(id) };

		const component = mount(CounterPage, { target: document.body });
		await waitForText('Cat treats');

		expect(document.body.querySelector('h1')?.textContent).toBe('Cat treats');
		unmount(component);
	});

	it('composes the log form, totals and history', async () => {
		const id = await addCounter({ name: 'Cat treats' }, T0);
		await logEntry(id, 4, T0);
		routeState.params = { id: String(id) };

		const component = mount(CounterPage, { target: document.body });
		await waitForText('History');

		expect(document.body.querySelector('input[aria-label="Amount"]')).not.toBeNull();
		expect(document.body.querySelectorAll('dd')).toHaveLength(3);
		await waitForText('Today');
		unmount(component);
	});

	it('reports a missing counter rather than rendering an empty shell', async () => {
		routeState.params = { id: '99999' };

		const component = mount(CounterPage, { target: document.body });
		await waitForText('Counter not found');

		expect(document.body.querySelector('input[aria-label="Amount"]')).toBeNull();
		unmount(component);
	});

	it('reports a non-numeric route id as not found', async () => {
		routeState.params = { id: 'banana' };

		const component = mount(CounterPage, { target: document.body });
		await waitForText('Counter not found');

		expect(document.body.textContent).toContain('Counter not found');
		unmount(component);
	});
});
