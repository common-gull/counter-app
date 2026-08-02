import { flushSync, mount, unmount } from 'svelte';
import { clearBody, field, submitForm, type, waitFor } from '../testing/dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { addCounter } from '../counters/queries';
import { resetDatabase } from '../testing/reset-db';
import LogForm from './LogForm.svelte';
import { listEntries } from './queries';

let counterId: number;

const waitForEntries = (count: number) =>
	waitFor(() => listEntries(counterId), (entries) => entries.length === count, `${count} entries`);

beforeEach(async () => {
	await resetDatabase();
	counterId = await addCounter({ name: 'Cat treats' }, 1_750_000_000_000);
});
afterEach(clearBody);

describe('LogForm', () => {
	it('logs an amount', async () => {
		const component = mount(LogForm, { target: document.body, props: { counterId } });

		type('Amount', '3');
		submitForm();

		const entries = await waitForEntries(1);
		expect(entries[0]!.amount).toBe(3);
		unmount(component);
	});

	it('logs a fractional amount', async () => {
		const component = mount(LogForm, { target: document.body, props: { counterId } });

		type('Amount', '1.5');
		submitForm();

		const entries = await waitForEntries(1);
		expect(entries[0]!.amount).toBe(1.5);
		unmount(component);
	});

	it('clears the field after logging', async () => {
		const component = mount(LogForm, { target: document.body, props: { counterId } });

		type('Amount', '3');
		submitForm();
		await waitForEntries(1);
		flushSync();

		expect(field('Amount').value).toBe('');
		unmount(component);
	});

	it('rejects zero and saves nothing', async () => {
		const component = mount(LogForm, { target: document.body, props: { counterId } });

		type('Amount', '0');
		submitForm();
		flushSync();

		expect(document.body.querySelector('[role="alert"]')?.textContent).toMatch(/greater than zero/i);
		expect(await listEntries(counterId)).toEqual([]);
		unmount(component);
	});

	it('rejects text and saves nothing', async () => {
		const component = mount(LogForm, { target: document.body, props: { counterId } });

		type('Amount', 'lots');
		submitForm();
		flushSync();

		expect(document.body.querySelector('[role="alert"]')).not.toBeNull();
		expect(await listEntries(counterId)).toEqual([]);
		unmount(component);
	});

	it('clears the error once a valid amount is logged', async () => {
		const component = mount(LogForm, { target: document.body, props: { counterId } });

		type('Amount', '0');
		submitForm();
		flushSync();
		expect(document.body.querySelector('[role="alert"]')).not.toBeNull();

		type('Amount', '2');
		submitForm();
		await waitForEntries(1);
		flushSync();

		expect(document.body.querySelector('[role="alert"]')).toBeNull();
		unmount(component);
	});

	it('mentions the unit in the placeholder', () => {
		const component = mount(LogForm, {
			target: document.body,
			props: { counterId, unit: 'treats' }
		});
		expect(field('Amount').placeholder).toBe('How many treats?');
		unmount(component);
	});
});
