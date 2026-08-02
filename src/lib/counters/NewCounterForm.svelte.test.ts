import { flushSync, mount, unmount } from 'svelte';
import { clearBody, field, submitForm, type, waitFor } from '../testing/dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { resetDatabase } from '../testing/reset-db';
import NewCounterForm from './NewCounterForm.svelte';
import { listCounters } from './queries';

beforeEach(resetDatabase);
afterEach(clearBody);

describe('NewCounterForm', () => {
	it('adds a counter with a trimmed name', async () => {
		const component = mount(NewCounterForm, { target: document.body });

		type('Counter name', '  Cat treats  ');
		submitForm();

		const counters = await waitFor(listCounters, (c) => c.length === 1, 'the new counter');
		expect(counters[0]!.name).toBe('Cat treats');
		unmount(component);
	});

	it('stores the optional unit', async () => {
		const component = mount(NewCounterForm, { target: document.body });

		type('Counter name', 'Water');
		type('Unit (optional)', 'cups');
		submitForm();

		const counters = await waitFor(listCounters, (c) => c.length === 1, 'the new counter');
		expect(counters[0]!.unit).toBe('cups');
		unmount(component);
	});

	it('omits the unit when left blank', async () => {
		const component = mount(NewCounterForm, { target: document.body });

		type('Counter name', 'Treats');
		type('Unit (optional)', '   ');
		submitForm();

		const counters = await waitFor(listCounters, (c) => c.length === 1, 'the new counter');
		expect(counters[0]).not.toHaveProperty('unit');
		unmount(component);
	});

	it('rejects an overlong unit and saves nothing', async () => {
		const component = mount(NewCounterForm, { target: document.body });

		type('Counter name', 'Water');
		type('Unit (optional)', 'x'.repeat(50));
		submitForm();
		flushSync();

		expect(document.body.querySelector('[role="alert"]')?.textContent).toMatch(/unit/i);
		expect(await listCounters()).toEqual([]);
		unmount(component);
	});

	it('rejects an empty name and saves nothing', async () => {
		const component = mount(NewCounterForm, { target: document.body });

		type('Counter name', '   ');
		submitForm();
		flushSync();

		expect(document.body.querySelector('[role="alert"]')?.textContent).toMatch(/name/i);
		expect(await listCounters()).toEqual([]);
		unmount(component);
	});

	it('clears the fields after a successful add', async () => {
		const component = mount(NewCounterForm, { target: document.body });

		type('Counter name', 'Treats');
		type('Unit (optional)', 'treats');
		submitForm();
		await waitFor(listCounters, (c) => c.length === 1, 'the new counter');
		flushSync();

		expect([field('Counter name').value, field('Unit (optional)').value]).toEqual(['', '']);
		unmount(component);
	});
});
