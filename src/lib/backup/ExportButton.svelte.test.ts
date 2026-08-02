import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { addCounter } from '../counters/queries';
import { logEntry } from '../entries/queries';
import { resetDatabase } from '../testing/reset-db';
import ExportButton from './ExportButton.svelte';
import { APP_ID } from './types';

const T0 = 1_750_000_000_000;

let saved: Blob[] = [];
let anchor: HTMLAnchorElement;

beforeEach(async () => {
	await resetDatabase();
	saved = [];
});

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	document.body.innerHTML = '';
});

/**
 * Stubs the download path. Installed after mounting so Svelte's own element
 * creation is untouched, and only anchors are intercepted.
 */
function stubDownload() {
	vi.stubGlobal('URL', {
		...URL,
		createObjectURL: (blob: Blob) => {
			saved.push(blob);
			return 'blob:test';
		},
		revokeObjectURL: () => {}
	});
	anchor = document.createElement('a');
	vi.spyOn(anchor, 'click').mockImplementation(() => {});
	const real = document.createElement.bind(document);
	vi.spyOn(document, 'createElement').mockImplementation((tag: string) =>
		tag === 'a' ? anchor : real(tag)
	);
}

async function clickExport() {
	document.body.querySelector('button')!.click();
	const deadline = Date.now() + 2000;
	while (saved.length === 0) {
		if (Date.now() > deadline) throw new Error('timed out waiting for the download');
		await new Promise((resolve) => setTimeout(resolve, 5));
	}
	flushSync();
}

describe('ExportButton', () => {
	it('downloads a backup of the stored data', async () => {
		const id = await addCounter({ name: 'Cat treats', unit: 'treats' }, T0);
		await logEntry(id, 3, T0);

		const component = mount(ExportButton, { target: document.body });
		flushSync();
		stubDownload();
		await clickExport();

		const written = JSON.parse(await saved[0]!.text());
		expect(written).toMatchObject({
			app: APP_ID,
			counters: [{ name: 'Cat treats', unit: 'treats' }],
			entries: [{ amount: 3, timestamp: T0 }]
		});
		unmount(component);
	});

	it('names the file after the export date', async () => {
		const component = mount(ExportButton, { target: document.body });
		flushSync();
		stubDownload();
		await clickExport();

		expect(anchor.download).toMatch(/^counter-app-backup-\d{4}-\d{2}-\d{2}\.json$/);
		unmount(component);
	});

	it('exports an empty backup when nothing is stored', async () => {
		const component = mount(ExportButton, { target: document.body });
		flushSync();
		stubDownload();
		await clickExport();

		const written = JSON.parse(await saved[0]!.text());
		expect([written.counters, written.entries]).toEqual([[], []]);
		unmount(component);
	});
});
