import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { stubDownload, type DownloadStub } from '../testing/stub-download';
import { backupFilename, saveJsonFile } from './download';

let stub: DownloadStub;

beforeEach(() => {
	stub = stubDownload();
});

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

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
		saveJsonFile('{"a":1}', 'backup.json');
		expect(stub.anchor.click).toHaveBeenCalledOnce();
		expect([stub.anchor.download, stub.anchor.getAttribute('href')]).toEqual([
			'backup.json',
			'blob:test'
		]);
	});

	it('writes the JSON into the blob', async () => {
		saveJsonFile('{"a":1}', 'backup.json');
		expect(await stub.blobs[0]!.text()).toBe('{"a":1}');
	});

	it('releases the object URL', () => {
		saveJsonFile('{}', 'backup.json');
		expect(stub.revoked).toEqual(['blob:test']);
	});
});
