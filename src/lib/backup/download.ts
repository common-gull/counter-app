import { dayKey } from '../time';

/** e.g. `counter-app-backup-2025-06-18.json`, dated in local time. */
export function backupFilename(at: number): string {
	return `counter-app-backup-${dayKey(at)}.json`;
}

/** Browser-only glue: hand the user a file. */
export function saveJsonFile(json: string, filename: string): void {
	const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
	const anchor = document.createElement('a');
	anchor.href = url;
	anchor.download = filename;
	anchor.click();
	URL.revokeObjectURL(url);
}
