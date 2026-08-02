import type { Counter } from '../counters/types';
import { validateCounterName, validateUnit } from '../counters/validate';
import type { Entry } from '../entries/types';
import { isValidAmount } from '../entries/validate';
import type { Validated } from '../validation';
import { APP_ID, SCHEMA_VERSION, type Backup } from './types';

/**
 * Validates an uploaded backup before anything touches the database.
 *
 * Import replaces everything, so a file that is wrong in a way we only notice
 * halfway through would destroy the user's data. Everything is checked up front.
 *
 * Import is also the second write path into these tables, so it applies the same
 * rules the forms do rather than a weaker type check of its own — otherwise a
 * hand-edited file could introduce a blank name or a negative amount that the UI
 * refuses to create. The rules are imported from the owning domain, so a rule added
 * there takes effect here too.
 */

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The named keys as finite numbers, or null if any is missing or not one. */
function numbersAt(row: Record<string, unknown>, keys: string[]): number[] | null {
	const values: number[] = [];
	for (const key of keys) {
		const value = row[key];
		if (typeof value !== 'number' || !Number.isFinite(value)) return null;
		values.push(value);
	}
	return values;
}

function parseCounter(raw: unknown): Counter | null {
	if (!isRecord(raw)) return null;

	const numbers = numbersAt(raw, ['id', 'createdAt', 'sortOrder']);
	if (!numbers) return null;
	const [id, createdAt, sortOrder] = numbers as [number, number, number];

	if (typeof raw.name !== 'string') return null;
	const name = validateCounterName(raw.name);
	if (!name.ok) return null;

	const counter: Counter = { id, name: name.value, createdAt, sortOrder };

	if (raw.unit !== undefined) {
		if (typeof raw.unit !== 'string') return null;
		const unit = validateUnit(raw.unit);
		if (!unit.ok) return null;
		// An empty unit means none, the same as everywhere else.
		if (unit.value !== '') counter.unit = unit.value;
	}

	return counter;
}

function parseEntry(raw: unknown): Entry | null {
	if (!isRecord(raw)) return null;

	const numbers = numbersAt(raw, ['id', 'counterId', 'amount', 'timestamp']);
	if (!numbers) return null;
	const [id, counterId, amount, timestamp] = numbers as [number, number, number, number];

	if (!isValidAmount(amount)) return null;

	return { id, counterId, amount, timestamp };
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

	const counters: Counter[] = [];
	for (const row of raw.counters) {
		const counter = parseCounter(row);
		if (!counter) return { ok: false, error: 'That backup has a damaged counter in it.' };
		counters.push(counter);
	}

	const entries: Entry[] = [];
	for (const row of raw.entries) {
		const entry = parseEntry(row);
		if (!entry) return { ok: false, error: 'That backup has a damaged entry in it.' };
		entries.push(entry);
	}

	// Deleting a counter cascades to its entries, so the app never holds an entry
	// without one. Importing must not be the way that invariant gets broken.
	const counterIds = new Set(counters.map((counter) => counter.id));
	if (entries.some((entry) => !counterIds.has(entry.counterId))) {
		return { ok: false, error: 'That backup has entries belonging to a missing counter.' };
	}

	return {
		ok: true,
		value: {
			app: APP_ID,
			schemaVersion: raw.schemaVersion,
			exportedAt: typeof raw.exportedAt === 'number' ? raw.exportedAt : 0,
			counters,
			entries
		}
	};
}
