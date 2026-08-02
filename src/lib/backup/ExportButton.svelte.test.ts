import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { addCounter } from '../counters/queries';
import { logEntry } from '../entries/queries';
import { clearBody, waitUntil } from '../testing/dom';
import { resetDatabase } from '../testing/reset-db';
import { stubDownload, type DownloadStub } from '../testing/stub-download';
import ExportButton from './ExportButton.svelte';
import { APP_ID } from './types';

const T0 = 1_750_000_000_000;

let stub: DownloadStub;

beforeEach(resetDatabase);

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	clearBody();
});

/** Mount first, then stub: the stub intercepts anchors Svelte may itself create. */
function render() {
	const component = mount(ExportButton, { target: document.body });
	flushSync();
	stub = stubDownload();
	return component;
}

async function clickExport() {
	document.body.querySelector('button')!.click();
	await waitUntil(() => stub.blobs.length > 0, 'the download');
}

describe('ExportButton', () => {
	it('downloads a backup of the stored data', async () => {
		const id = await addCounter({ name: 'Cat treats', unit: 'treats' }, T0);
		await logEntry(id, 3, T0);

		const component = render();
		await clickExport();

		expect(JSON.parse(await stub.blobs[0]!.text())).toMatchObject({
			app: APP_ID,
			counters: [{ name: 'Cat treats', unit: 'treats' }],
			entries: [{ amount: 3, timestamp: T0 }]
		});
		unmount(component);
	});

	it('names the file after the export date', async () => {
		const component = render();
		await clickExport();

		expect(stub.anchor.download).toMatch(/^counter-app-backup-\d{4}-\d{2}-\d{2}\.json$/);
		unmount(component);
	});

	it('exports an empty backup when nothing is stored', async () => {
		const component = render();
		await clickExport();

		const written = JSON.parse(await stub.blobs[0]!.text());
		expect([written.counters, written.entries]).toEqual([[], []]);
		unmount(component);
	});
});
