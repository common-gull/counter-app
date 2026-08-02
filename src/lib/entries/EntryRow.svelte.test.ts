import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { addCounter } from '../counters/queries';
import { resetDatabase } from '../testing/reset-db';
import EntryRow from './EntryRow.svelte';
import { listEntries, logEntry } from './queries';
import type { Entry } from './types';

const T0 = new Date('2025-06-18T14:30:00-04:00').getTime();

let counterId: number;
let entry: Entry;

beforeEach(async () => {
	await resetDatabase();
	counterId = await addCounter({ name: 'Cat treats' }, T0);
	await logEntry(counterId, 3, T0);
	entry = (await listEntries(counterId))[0]!;
});
afterEach(() => {
	document.body.innerHTML = '';
});

function render(unit?: string) {
	return mount(EntryRow, { target: document.body, props: { entry, unit } });
}

function button(label: string): HTMLButtonElement {
	const match = [...document.body.querySelectorAll('button')].find(
		(b) => b.textContent?.trim() === label
	);
	if (!match) throw new Error(`no button labelled "${label}"`);
	return match;
}

function click(label: string) {
	button(label).click();
	flushSync();
}

function field(label: string): HTMLInputElement {
	return document.body.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`)!;
}

function type(label: string, value: string) {
	const input = field(label);
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

const currentEntries = () => listEntries(counterId);

describe('EntryRow view mode', () => {
	it('shows the amount and time', () => {
		const component = render();
		expect(document.body.textContent).toContain('3');
		expect(document.body.textContent).toContain('2:30 PM');
		unmount(component);
	});

	it('shows the unit when given', () => {
		const component = render('treats');
		expect(document.body.textContent).toContain('treats');
		unmount(component);
	});
});

describe('EntryRow editing', () => {
	it('pre-fills the current amount and time', () => {
		const component = render();
		click('Edit');
		expect([field('Amount').value, field('Date and time').value]).toEqual([
			'3',
			'2025-06-18T14:30'
		]);
		unmount(component);
	});

	it('saves a changed amount', async () => {
		const component = render();
		click('Edit');
		type('Amount', '8');
		submitForm();

		const entries = await waitFor(currentEntries, (e) => e[0]!.amount === 8, 'the new amount');
		expect(entries[0]).toMatchObject({ amount: 8, timestamp: T0 });
		unmount(component);
	});

	it('saves a changed time', async () => {
		const component = render();
		click('Edit');
		type('Date and time', '2025-06-18T09:15');
		submitForm();

		const expected = new Date('2025-06-18T09:15:00-04:00').getTime();
		const entries = await waitFor(currentEntries, (e) => e[0]!.timestamp === expected, 'the time');
		expect(entries[0]).toMatchObject({ amount: 3, timestamp: expected });
		unmount(component);
	});

	it('returns to view mode after saving', async () => {
		const component = render();
		click('Edit');
		type('Amount', '8');
		submitForm();
		await waitFor(currentEntries, (e) => e[0]!.amount === 8, 'the new amount');
		flushSync();

		expect(document.body.querySelector('form')).toBeNull();
		unmount(component);
	});

	it('rejects an invalid amount and saves nothing', async () => {
		const component = render();
		click('Edit');
		type('Amount', '0');
		submitForm();
		flushSync();

		expect(document.body.querySelector('[role="alert"]')?.textContent).toMatch(/greater than zero/i);
		expect((await currentEntries())[0]!.amount).toBe(3);
		unmount(component);
	});

	it('rejects a time that DST skipped and saves nothing', async () => {
		const component = render();
		click('Edit');
		type('Date and time', '2025-03-09T02:30');
		submitForm();
		flushSync();

		expect(document.body.querySelector('[role="alert"]')?.textContent).toMatch(/date and time/i);
		expect((await currentEntries())[0]!.timestamp).toBe(T0);
		unmount(component);
	});

	it('discards changes on cancel', async () => {
		const component = render();
		click('Edit');
		type('Amount', '99');
		click('Cancel');

		expect(document.body.querySelector('form')).toBeNull();
		expect((await currentEntries())[0]!.amount).toBe(3);
		unmount(component);
	});

	it('re-opens with the stored value after a cancelled edit', () => {
		const component = render();
		click('Edit');
		type('Amount', '99');
		click('Cancel');
		click('Edit');

		expect(field('Amount').value).toBe('3');
		unmount(component);
	});
});

describe('EntryRow deleting', () => {
	it('asks before deleting', async () => {
		const component = render();
		click('Delete');

		expect(document.body.textContent).toContain('Delete this entry?');
		expect(await currentEntries()).toHaveLength(1);
		unmount(component);
	});

	it('deletes once confirmed', async () => {
		const component = render();
		click('Delete');
		click('Delete');

		const entries = await waitFor(currentEntries, (e) => e.length === 0, 'the deletion');
		expect(entries).toEqual([]);
		unmount(component);
	});

	it('keeps the entry when the confirm is dismissed', async () => {
		const component = render();
		click('Delete');
		click('Keep');

		expect(document.body.textContent).not.toContain('Delete this entry?');
		expect(await currentEntries()).toHaveLength(1);
		unmount(component);
	});
});
