import { db } from '../db';
import type { Counter, NewCounter } from './types';

/**
 * Writes that record a moment take an optional `at` (UTC epoch ms) so tests pin the
 * instant instead of mocking the clock. Production callers omit it.
 *
 * Mutating an id that does not exist is a no-op, not an error.
 */

export function listCounters(): Promise<Counter[]> {
	return db.counters.orderBy('sortOrder').toArray();
}

export function getCounter(id: number): Promise<Counter | undefined> {
	return db.counters.get(id);
}

export function addCounter(input: NewCounter, at?: number): Promise<number> {
	return db.transaction('rw', db.counters, async () => {
		const last = await db.counters.orderBy('sortOrder').last();
		return db.counters.add({
			name: input.name,
			// Omitted rather than stored as undefined, so exports stay clean.
			...(input.unit === undefined ? {} : { unit: input.unit }),
			createdAt: at ?? Date.now(),
			sortOrder: last ? last.sortOrder + 1 : 0
		});
	});
}

export async function renameCounter(id: number, name: string): Promise<void> {
	await db.counters.update(id, { name });
}

/** Cascades: a counter's entries go with it. */
export async function deleteCounter(id: number): Promise<void> {
	await db.transaction('rw', db.counters, db.entries, async () => {
		await db.counters.delete(id);
		await db.entries.where('counterId').equals(id).delete();
	});
}
