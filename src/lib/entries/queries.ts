import { Dexie } from 'dexie';
import { db } from '../db';
import type { Range } from '../time';
import type { Entry, EntryPatch } from './types';

/** How many entries the history list loads. */
export const HISTORY_LIMIT = 100;

/** Newest first. */
export function listEntries(counterId: number, limit?: number): Promise<Entry[]> {
	const newestFirst = db.entries
		.where('[counterId+timestamp]')
		.between([counterId, Dexie.minKey], [counterId, Dexie.maxKey], true, true)
		.reverse();
	return limit === undefined ? newestFirst.toArray() : newestFirst.limit(limit).toArray();
}

export function logEntry(counterId: number, amount: number, at?: number): Promise<number> {
	return db.entries.add({ counterId, amount, timestamp: at ?? Date.now() });
}

export async function updateEntry(id: number, patch: EntryPatch): Promise<void> {
	// Undefined keys must be stripped: Dexie would write them as undefined rather
	// than leaving the existing value alone.
	const changes: EntryPatch = {};
	if (patch.amount !== undefined) changes.amount = patch.amount;
	if (patch.timestamp !== undefined) changes.timestamp = patch.timestamp;
	if (Object.keys(changes).length === 0) return;
	await db.entries.update(id, changes);
}

export async function deleteEntry(id: number): Promise<void> {
	await db.entries.delete(id);
}

/** Sum of `amount` over `[range.from, range.to)`. */
export async function totalBetween(counterId: number, range: Range): Promise<number> {
	let sum = 0;
	await db.entries
		.where('[counterId+timestamp]')
		.between([counterId, range.from], [counterId, range.to], true, false)
		.each((entry) => {
			sum += entry.amount;
		});
	return sum;
}
