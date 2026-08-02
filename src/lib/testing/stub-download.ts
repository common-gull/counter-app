import { vi } from 'vitest';

/**
 * jsdom implements neither `URL.createObjectURL` nor a real download, so both the
 * `saveJsonFile` tests and the ExportButton tests need the same stub. Only anchors are
 * intercepted, so Svelte's own element creation is untouched — install it after
 * mounting.
 *
 * Call `vi.restoreAllMocks()` and `vi.unstubAllGlobals()` in `afterEach`.
 */
export interface DownloadStub {
	/** The anchor `saveJsonFile` clicked, carrying `download` and `href`. */
	anchor: HTMLAnchorElement;
	/** Blobs handed to `URL.createObjectURL`, in order. */
	blobs: Blob[];
	/** Object URLs passed to `URL.revokeObjectURL`. */
	revoked: string[];
}

export function stubDownload(): DownloadStub {
	const blobs: Blob[] = [];
	const revoked: string[] = [];

	vi.stubGlobal('URL', {
		...URL,
		createObjectURL: (blob: Blob) => {
			blobs.push(blob);
			return 'blob:test';
		},
		revokeObjectURL: (url: string) => revoked.push(url)
	});

	const anchor = document.createElement('a');
	vi.spyOn(anchor, 'click').mockImplementation(() => {});

	const realCreateElement = document.createElement.bind(document);
	vi.spyOn(document, 'createElement').mockImplementation((tag: string) =>
		tag === 'a' ? anchor : realCreateElement(tag)
	);

	return { anchor, blobs, revoked };
}
