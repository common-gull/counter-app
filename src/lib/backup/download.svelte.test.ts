import { afterEach, describe, expect, it, vi } from 'vitest';
import { backupFilename, saveJsonFile } from './download';

// jsdom implements neither of these; the point of the test is the wiring around them.
const created: Blob[] = [];
const revoked: string[] = [];

afterEach(() => {
	created.length = 0;
	revoked.length = 0;
	vi.restoreAllMocks();
});

function stubObjectUrls() {
	vi.stubGlobal('URL', {
		...URL,
		createObjectURL: (blob: Blob) => {
			created.push(blob);
			return 'blob:test';
		},
		revokeObjectURL: (url: string) => revoked.push(url)
	});
}

describe('backupFilename', () => {
	it('dates the file in local time', () => {
		expect(backupFilename(new Date('2025-06-18T12:00:00-04:00').getTime())).toBe(
			'counter-app-backup-2025-06-18.json'
		);
	});

	it('uses the local day, not the UTC day', () => {
		// 01:00Z on the 19th is still the 18th in New York.
		expect(backupFilename(new Date('2025-06-19T01:00:00Z').getTime())).toBe(
			'counter-app-backup-2025-06-18.json'
		);
	});
});

describe('saveJsonFile', () => {
	it('clicks a download link carrying the filename', () => {
		stubObjectUrls();
		const anchor = document.createElement('a');
		const click = vi.spyOn(anchor, 'click').mockImplementation(() => {});
		vi.spyOn(document, 'createElement').mockReturnValue(anchor);

		saveJsonFile('{"a":1}', 'backup.json');

		expect(click).toHaveBeenCalledOnce();
		expect([anchor.download, anchor.getAttribute('href')]).toEqual(['backup.json', 'blob:test']);
	});

	it('writes the JSON into the blob', async () => {
		stubObjectUrls();
		const anchor = document.createElement('a');
		vi.spyOn(anchor, 'click').mockImplementation(() => {});
		vi.spyOn(document, 'createElement').mockReturnValue(anchor);

		saveJsonFile('{"a":1}', 'backup.json');

		expect(await created[0]!.text()).toBe('{"a":1}');
	});

	it('releases the object URL', () => {
		stubObjectUrls();
		const anchor = document.createElement('a');
		vi.spyOn(anchor, 'click').mockImplementation(() => {});
		vi.spyOn(document, 'createElement').mockReturnValue(anchor);

		saveJsonFile('{}', 'backup.json');

		expect(revoked).toEqual(['blob:test']);
	});
});
