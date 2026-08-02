import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { resetDatabase } from '../testing/reset-db';
import NewCounterForm from './NewCounterForm.svelte';
import { listCounters } from './queries';

beforeEach(resetDatabase);
afterEach(() => {
	document.body.innerHTML = '';
});

function field(label: string): HTMLInputElement {
	const input = document.body.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`);
	if (!input) throw new Error(`no input labelled "${label}"`);
	return input;
}

/** Set a bound input's value the way a user would, so Svelte sees the change. */
function type(input: HTMLInputElement, value: string) {
	input.value = value;
	input.dispatchEvent(new Event('input', { bubbles: true }));
	flushSync();
}

function submitForm() {
	document.body.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true }));
}

async function waitFor<T>(read: () => Promise<T>, ready: (value: T) => boolean, label: string) {
	const deadline = Date.now() + 2000;
	for (;;) {
		const value = await read();
		if (ready(value)) return value;
		if (Date.now() > deadline) throw new Error(`timed out waiting for ${label}`);
		await new Promise((resolve) => setTimeout(resolve, 5));
	}
}

describe('NewCounterForm', () => {
	it('adds a counter with a trimmed name', async () => {
		const component = mount(NewCounterForm, { target: document.body });

		type(field('Counter name'), '  Cat treats  ');
		submitForm();

		const counters = await waitFor(listCounters, (c) => c.length === 1, 'the new counter');
		expect(counters[0]!.name).toBe('Cat treats');
		unmount(component);
	});

	it('stores the optional unit', async () => {
		const component = mount(NewCounterForm, { target: document.body });

		type(field('Counter name'), 'Water');
		type(field('Unit (optional)'), 'cups');
		submitForm();

		const counters = await waitFor(listCounters, (c) => c.length === 1, 'the new counter');
		expect(counters[0]!.unit).toBe('cups');
		unmount(component);
	});

	it('omits the unit when left blank', async () => {
		const component = mount(NewCounterForm, { target: document.body });

		type(field('Counter name'), 'Treats');
		type(field('Unit (optional)'), '   ');
		submitForm();

		const counters = await waitFor(listCounters, (c) => c.length === 1, 'the new counter');
		expect(counters[0]).not.toHaveProperty('unit');
		unmount(component);
	});

	it('rejects an overlong unit and saves nothing', async () => {
		const component = mount(NewCounterForm, { target: document.body });

		type(field('Counter name'), 'Water');
		type(field('Unit (optional)'), 'x'.repeat(50));
		submitForm();
		flushSync();

		expect(document.body.querySelector('[role="alert"]')?.textContent).toMatch(/unit/i);
		expect(await listCounters()).toEqual([]);
		unmount(component);
	});

	it('rejects an empty name and saves nothing', async () => {
		const component = mount(NewCounterForm, { target: document.body });

		type(field('Counter name'), '   ');
		submitForm();
		flushSync();

		expect(document.body.querySelector('[role="alert"]')?.textContent).toMatch(/name/i);
		expect(await listCounters()).toEqual([]);
		unmount(component);
	});

	it('clears the fields after a successful add', async () => {
		const component = mount(NewCounterForm, { target: document.body });

		type(field('Counter name'), 'Treats');
		type(field('Unit (optional)'), 'treats');
		submitForm();
		await waitFor(listCounters, (c) => c.length === 1, 'the new counter');
		flushSync();

		expect([field('Counter name').value, field('Unit (optional)').value]).toEqual(['', '']);
		unmount(component);
	});
});
