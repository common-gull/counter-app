import type { Counter } from '../counters/types';
import type { Entry } from '../entries/types';

export const APP_ID = 'counter-app';

/** Bumped whenever the exported shape stops being readable by an older build. */
export const SCHEMA_VERSION = 1;

export interface Backup {
	app: typeof APP_ID;
	schemaVersion: number;
	/** UTC epoch ms. */
	exportedAt: number;
	counters: Counter[];
	entries: Entry[];
}
