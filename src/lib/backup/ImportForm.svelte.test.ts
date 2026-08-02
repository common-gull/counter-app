import { flushSync, mount, unmount } from 'svelte';
import { button, clearBody, settle, waitUntil } from '../testing/dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { addCounter, listCounters } from '../counters/queries';
import { listEntries } from '../entries/queries';
import { resetDatabase } from '../testing/reset-db';
import ImportForm from './ImportForm.svelte';
import { APP_ID, SCHEMA_VERSION, type Backup } from './types';

const T0 = 1_750_000_000_000;

const backup: Backup = {
	app: APP_ID,
	schemaVersion: SCHEMA_VERSION,
	exportedAt: T0,
	counters: [{ id: 1, name: 'Imported treats', createdAt: T0, sortOrder: 0 }],
	entries: [
		{ id: 1, counterId: 1, amount: 3, timestamp: T0 },
		{ id: 2, counterId: 1, amount: 4, timestamp: T0 }
	]
};

beforeEach(resetDatabase);
afterEach(clearBody);

/** Mount and flush, so `bind:this` is populated before anything is dispatched. */
function render() {
	const component = mount(ImportForm, { target: document.body });
	flushSync();
	return component;
}

function fileInput(): HTMLInputElement {
	return document.body.querySelector<HTMLInputElement>('input[type="file"]')!;
}

/** Simulate picking a file; jsdom won't populate `files` on its own. */
async function choose(contents: string, name = 'backup.json') {
	const input = fileInput();
	const file = new File([contents], name, { type: 'application/json' });
	Object.defineProperty(input, 'files', { value: [file], configurable: true });
	input.dispatchEvent(new Event('change', { bubbles: true }));
	await settle(10);
}

describe('ImportForm control', () => {
	it('offers a visible labelled control, not a bare file input', () => {
		const component = render();
		const label = document.body.querySelector('label');
		expect(label?.textContent?.trim()).toBe('Choose backup file…');
		unmount(component);
	});

	it('nests the input inside the label so clicking it opens the picker', () => {
		const component = render();
		const label = document.body.querySelector('label')!;
		expect(label.contains(fileInput())).toBe(true);
		unmount(component);
	});

	it('hides the raw file input rather than showing the browser default', () => {
		const component = render();
		expect(fileInput().className).toContain('sr-only');
		unmount(component);
	});

	it('keeps the input reachable to assistive tech', () => {
		const component = render();
		expect(fileInput().getAttribute('aria-label')).toBe('Backup file');
		unmount(component);
	});
});

describe('ImportForm', () => {
	it('asks for confirmation before importing, showing the counts', async () => {
		const component = render();

		await choose(JSON.stringify(backup));

		expect(document.body.textContent).toContain('1 counters and 2 entries');
		unmount(component);
	});

	it('writes nothing until confirmed', async () => {
		await addCounter({ name: 'Existing' }, T0);
		const component = render();

		await choose(JSON.stringify(backup));

		expect((await listCounters()).map((c) => c.name)).toEqual(['Existing']);
		unmount(component);
	});

	it('replaces the data once confirmed', async () => {
		await addCounter({ name: 'Existing' }, T0);
		const component = render();

		await choose(JSON.stringify(backup));
		button('Replace my data').click();
		await waitUntil(async () => (await listCounters())[0]?.name === 'Imported treats', 'the import');

		const counters = await listCounters();
		expect(counters.map((c) => c.name)).toEqual(['Imported treats']);
		expect(await listEntries(counters[0]!.id)).toHaveLength(2);
		unmount(component);
	});

	it('reports what was restored', async () => {
		const component = render();

		await choose(JSON.stringify(backup));
		button('Replace my data').click();
		await waitUntil(
			async () => document.body.querySelector('[role="status"]') !== null,
			'the success message'
		);

		expect(document.body.querySelector('[role="status"]')?.textContent).toContain(
			'Restored 1 counters and 2 entries'
		);
		unmount(component);
	});

	it('leaves the data alone when cancelled', async () => {
		await addCounter({ name: 'Existing' }, T0);
		const component = render();

		await choose(JSON.stringify(backup));
		button('Cancel').click();
		flushSync();

		expect(document.body.textContent).not.toContain('Replace my data');
		expect((await listCounters()).map((c) => c.name)).toEqual(['Existing']);
		unmount(component);
	});

	it('rejects a file from another app without offering to import', async () => {
		const component = render();

		await choose(JSON.stringify({ ...backup, app: 'todo-app' }));

		expect(document.body.querySelector('[role="alert"]')).not.toBeNull();
		expect(document.body.textContent).not.toContain('Replace my data');
		unmount(component);
	});

	it('rejects malformed JSON', async () => {
		const component = render();

		await choose('{ not json');

		expect(document.body.querySelector('[role="alert"]')?.textContent).toMatch(/JSON/i);
		unmount(component);
	});

	it('rejects a damaged entry and writes nothing', async () => {
		await addCounter({ name: 'Existing' }, T0);
		const component = render();

		await choose(JSON.stringify({ ...backup, entries: [{ id: 1, counterId: 1 }] }));

		expect(document.body.querySelector('[role="alert"]')).not.toBeNull();
		expect((await listCounters()).map((c) => c.name)).toEqual(['Existing']);
		unmount(component);
	});

	it('clears a previous error when a good file is chosen', async () => {
		const component = render();

		await choose('{ not json');
		expect(document.body.querySelector('[role="alert"]')).not.toBeNull();

		await choose(JSON.stringify(backup));

		expect(document.body.querySelector('[role="alert"]')).toBeNull();
		unmount(component);
	});
});
