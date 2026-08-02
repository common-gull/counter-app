import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { addCounter } from '../counters/queries';
import { resetDatabase } from '../testing/reset-db';
import LogForm from './LogForm.svelte';
import { listEntries } from './queries';

let counterId: number;

beforeEach(async () => {
	await resetDatabase();
	counterId = await addCounter({ name: 'Cat treats' }, 1_750_000_000_000);
});
afterEach(() => {
	document.body.innerHTML = '';
});

function amountField(): HTMLInputElement {
	return document.body.querySelector<HTMLInputElement>('input[aria-label="Amount"]')!;
}

function type(value: string) {
	const input = amountField();
	input.value = value;
	input.dispatchEvent(new Event('input', { bubbles: true }));
	flushSync();
}

function submitForm() {
	document.body.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true }));
}

async function waitForEntries(count: number, timeoutMs = 2000) {
	const deadline = Date.now() + timeoutMs;
	for (;;) {
		const entries = await listEntries(counterId);
		if (entries.length === count) return entries;
		if (Date.now() > deadline) throw new Error(`timed out waiting for ${count} entries`);
		await new Promise((resolve) => setTimeout(resolve, 5));
	}
}

describe('LogForm', () => {
	it('logs an amount', async () => {
		const component = mount(LogForm, { target: document.body, props: { counterId } });

		type('3');
		submitForm();

		const entries = await waitForEntries(1);
		expect(entries[0]!.amount).toBe(3);
		unmount(component);
	});

	it('logs a fractional amount', async () => {
		const component = mount(LogForm, { target: document.body, props: { counterId } });

		type('1.5');
		submitForm();

		const entries = await waitForEntries(1);
		expect(entries[0]!.amount).toBe(1.5);
		unmount(component);
	});

	it('clears the field after logging', async () => {
		const component = mount(LogForm, { target: document.body, props: { counterId } });

		type('3');
		submitForm();
		await waitForEntries(1);
		flushSync();

		expect(amountField().value).toBe('');
		unmount(component);
	});

	it('rejects zero and saves nothing', async () => {
		const component = mount(LogForm, { target: document.body, props: { counterId } });

		type('0');
		submitForm();
		flushSync();

		expect(document.body.querySelector('[role="alert"]')?.textContent).toMatch(/greater than zero/i);
		expect(await listEntries(counterId)).toEqual([]);
		unmount(component);
	});

	it('rejects text and saves nothing', async () => {
		const component = mount(LogForm, { target: document.body, props: { counterId } });

		type('lots');
		submitForm();
		flushSync();

		expect(document.body.querySelector('[role="alert"]')).not.toBeNull();
		expect(await listEntries(counterId)).toEqual([]);
		unmount(component);
	});

	it('clears the error once a valid amount is logged', async () => {
		const component = mount(LogForm, { target: document.body, props: { counterId } });

		type('0');
		submitForm();
		flushSync();
		expect(document.body.querySelector('[role="alert"]')).not.toBeNull();

		type('2');
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
		expect(amountField().placeholder).toBe('How many treats?');
		unmount(component);
	});
});
