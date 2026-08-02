import type { Validated } from '../validation';
import { APP_ID, SCHEMA_VERSION, type Backup } from './types';

/**
 * Validates an uploaded backup before anything touches the database.
 *
 * Import replaces everything, so a file that is wrong in a way we only notice
 * halfway through would destroy the user's data. Everything is checked up front.
 */

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasNumbers(row: unknown, keys: string[]): boolean {
	return isRecord(row) && keys.every((key) => typeof row[key] === 'number' && isFinite(row[key]));
}

export function parseBackup(text: string): Validated<Backup> {
	let raw: unknown;
	try {
		raw = JSON.parse(text);
	} catch {
		return { ok: false, error: "That file isn't valid JSON." };
	}

	if (!isRecord(raw)) return { ok: false, error: "That file isn't a counter backup." };
	if (raw.app !== APP_ID) return { ok: false, error: "That file isn't a counter backup." };

	if (typeof raw.schemaVersion !== 'number') {
		return { ok: false, error: 'That backup is missing its version.' };
	}
	if (raw.schemaVersion > SCHEMA_VERSION) {
		return { ok: false, error: 'That backup was made by a newer version of the app.' };
	}

	if (!Array.isArray(raw.counters) || !Array.isArray(raw.entries)) {
		return { ok: false, error: 'That backup is missing its counters or entries.' };
	}

	const countersValid = raw.counters.every(
		(c) => hasNumbers(c, ['id', 'createdAt', 'sortOrder']) && typeof c.name === 'string'
	);
	if (!countersValid) return { ok: false, error: 'That backup has a damaged counter in it.' };

	const entriesValid = raw.entries.every((e) =>
		hasNumbers(e, ['id', 'counterId', 'amount', 'timestamp'])
	);
	if (!entriesValid) return { ok: false, error: 'That backup has a damaged entry in it.' };

	return {
		ok: true,
		value: {
			app: APP_ID,
			schemaVersion: raw.schemaVersion,
			exportedAt: typeof raw.exportedAt === 'number' ? raw.exportedAt : 0,
			counters: raw.counters,
			entries: raw.entries
		}
	};
}
