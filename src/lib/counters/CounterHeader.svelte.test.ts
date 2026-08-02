import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { countEntries, logEntry } from '../entries/queries';
import { resetDatabase } from '../testing/reset-db';
import CounterHeader from './CounterHeader.svelte';
import { addCounter, getCounter, listCounters } from './queries';
import type { Counter } from './types';

const T0 = 1_750_000_000_000;

let counter: Counter;

beforeEach(async () => {
	await resetDatabase();
	const id = await addCounter({ name: 'Cat treats' }, T0);
	counter = (await getCounter(id))!;
});
afterEach(() => {
	document.body.innerHTML = '';
});

function render(ondeleted?: () => void) {
	const component = mount(CounterHeader, {
		target: document.body,
		props: { counter, ondeleted }
	});
	flushSync();
	return component;
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

function nameField(): HTMLInputElement {
	return document.body.querySelector<HTMLInputElement>('input[aria-label="Counter name"]')!;
}

function type(value: string) {
	const input = nameField();
	input.value = value;
	input.dispatchEvent(new Event('input', { bubbles: true }));
	flushSync();
}

function submitForm() {
	document.body.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true }));
}

async function waitUntil(ready: () => Promise<boolean>, label: string, timeoutMs = 2000) {
	const deadline = Date.now() + timeoutMs;
	while (!(await ready())) {
		if (Date.now() > deadline) throw new Error(`timed out waiting for ${label}`);
		await new Promise((resolve) => setTimeout(resolve, 5));
	}
	flushSync();
}

/** Svelte splits interpolated copy across text nodes, so compare on collapsed whitespace. */
const visibleText = () => document.body.textContent?.replace(/\s+/g, ' ').trim() ?? '';

async function waitForText(text: string, timeoutMs = 2000) {
	const deadline = Date.now() + timeoutMs;
	while (!visibleText().includes(text)) {
		if (Date.now() > deadline) {
			throw new Error(`timed out waiting for "${text}"; saw "${visibleText()}"`);
		}
		await new Promise((resolve) => setTimeout(resolve, 5));
	}
}

describe('CounterHeader', () => {
	it('shows the counter name', () => {
		const component = render();
		expect(document.body.querySelector('h1')?.textContent).toBe('Cat treats');
		unmount(component);
	});
});

describe('CounterHeader renaming', () => {
	it('pre-fills the current name', () => {
		const component = render();
		click('Rename');
		expect(nameField().value).toBe('Cat treats');
		unmount(component);
	});

	it('saves a new name', async () => {
		const component = render();
		click('Rename');
		type('Dog treats');
		submitForm();

		await waitUntil(async () => (await getCounter(counter.id))?.name === 'Dog treats', 'the rename');
		expect((await getCounter(counter.id))?.name).toBe('Dog treats');
		unmount(component);
	});

	it('trims the new name', async () => {
		const component = render();
		click('Rename');
		type('   Dog treats   ');
		submitForm();

		await waitUntil(async () => (await getCounter(counter.id))?.name === 'Dog treats', 'the rename');
		expect((await getCounter(counter.id))?.name).toBe('Dog treats');
		unmount(component);
	});

	it('rejects an empty name and saves nothing', async () => {
		const component = render();
		click('Rename');
		type('   ');
		submitForm();
		flushSync();

		expect(document.body.querySelector('[role="alert"]')).not.toBeNull();
		expect((await getCounter(counter.id))?.name).toBe('Cat treats');
		unmount(component);
	});

	it('discards changes on cancel', async () => {
		const component = render();
		click('Rename');
		type('Something else');
		click('Cancel');

		expect(document.body.querySelector('form')).toBeNull();
		expect((await getCounter(counter.id))?.name).toBe('Cat treats');
		unmount(component);
	});
});

describe('CounterHeader deleting', () => {
	it('asks first, and says how many entries go with it', async () => {
		await logEntry(counter.id, 1, T0);
		await logEntry(counter.id, 2, T0);
		const component = render();

		click('Delete');
		await waitForText('2 entries');

		expect(visibleText()).toContain('Delete "Cat treats"?');
		expect(await listCounters()).toHaveLength(1);
		unmount(component);
	});

	it('says so when there are no entries to lose', async () => {
		const component = render();

		click('Delete');
		await waitForText('no entries');

		expect(visibleText()).toContain('It has no entries');
		unmount(component);
	});

	it('uses the singular for one entry', async () => {
		await logEntry(counter.id, 1, T0);
		const component = render();

		click('Delete');
		await waitForText('1 entry');

		expect(visibleText()).not.toContain('1 entries');
		unmount(component);
	});

	it('deletes the counter and its entries once confirmed', async () => {
		await logEntry(counter.id, 1, T0);
		const component = render();

		click('Delete');
		await waitForText('1 entry');
		click('Delete counter');

		await waitUntil(async () => (await listCounters()).length === 0, 'the deletion');
		expect(await countEntries(counter.id)).toBe(0);
		unmount(component);
	});

	it('reports back so the page can navigate away', async () => {
		const ondeleted = vi.fn();
		const component = render(ondeleted);

		click('Delete');
		await waitForText('no entries');
		click('Delete counter');

		await waitUntil(async () => ondeleted.mock.calls.length > 0, 'the callback');
		expect(ondeleted).toHaveBeenCalledOnce();
		unmount(component);
	});

	it('keeps the counter when the confirm is dismissed', async () => {
		const component = render();

		click('Delete');
		await waitForText('no entries');
		click('Cancel');

		expect(visibleText()).not.toContain('Delete counter');
		expect(await listCounters()).toHaveLength(1);
		unmount(component);
	});
});
