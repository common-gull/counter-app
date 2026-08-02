import { mount, unmount } from 'svelte';
import { clearBody, waitForText } from '../testing/dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { logEntry } from '../entries/queries';
import { resetDatabase } from '../testing/reset-db';
import CounterList from './CounterList.svelte';
import { addCounter } from './queries';

// A fixed instant inside a known local day, so "today" never straddles midnight.
const NOW = new Date('2025-06-18T12:00:00-04:00');
const T0 = NOW.getTime();

beforeEach(resetDatabase);
afterEach(clearBody);

describe('CounterList', () => {
	it('shows an empty state when there are no counters', async () => {
		const component = mount(CounterList, { target: document.body, props: { now: NOW } });
		await waitForText('No counters yet');
		expect(document.body.querySelectorAll('li')).toHaveLength(0);
		unmount(component);
	});

	it('lists counters with their name', async () => {
		await addCounter({ name: 'Cat treats' }, T0);
		await addCounter({ name: 'Water' }, T0);

		const component = mount(CounterList, { target: document.body, props: { now: NOW } });
		await waitForText('Water');

		expect(document.body.querySelectorAll('li')).toHaveLength(2);
		unmount(component);
	});

	it("shows today's total for a counter", async () => {
		const id = await addCounter({ name: 'Cat treats' }, T0);
		await logEntry(id, 2, T0);
		await logEntry(id, 3, T0);

		const component = mount(CounterList, { target: document.body, props: { now: NOW } });
		await waitForText('5');

		expect(document.body.textContent).toContain('5');
		unmount(component);
	});

	it("excludes entries from other days from today's total", async () => {
		const id = await addCounter({ name: 'Cat treats' }, T0);
		await logEntry(id, 2, T0);
		await logEntry(id, 40, T0 - 3 * 24 * 60 * 60_000); // three days earlier

		const component = mount(CounterList, { target: document.body, props: { now: NOW } });
		await waitForText('2');

		expect(document.body.textContent).not.toContain('42');
		unmount(component);
	});

	it('renders the unit when the counter has one', async () => {
		const id = await addCounter({ name: 'Water', unit: 'cups' }, T0);
		await logEntry(id, 1, T0);

		const component = mount(CounterList, { target: document.body, props: { now: NOW } });
		await waitForText('cups');

		expect(document.body.textContent).toContain('cups');
		unmount(component);
	});

	it('links each counter to its detail page', async () => {
		const id = await addCounter({ name: 'Cat treats' }, T0);

		const component = mount(CounterList, { target: document.body, props: { now: NOW } });
		await waitForText('Cat treats');

		// Hash routing: resolve() prefixes the base and the '#'.
		expect(document.body.querySelector('a')?.getAttribute('href')).toBe(`#/counter/${id}`);
		unmount(component);
	});

	it('picks up a counter added after mount', async () => {
		const component = mount(CounterList, { target: document.body, props: { now: NOW } });
		await waitForText('No counters yet');

		await addCounter({ name: 'Added later' }, T0);
		await waitForText('Added later');

		expect(document.body.querySelectorAll('li')).toHaveLength(1);
		unmount(component);
	});
});
