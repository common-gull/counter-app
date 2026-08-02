import { listCounters } from '../counters/queries';
import { db } from '../db';
import { APP_ID, SCHEMA_VERSION, type Backup } from './types';

export function exportAll(at?: number): Promise<Backup> {
	return db.transaction('r', db.counters, db.entries, async () => {
		// Neither read depends on the other, and they share the one transaction.
		const [counters, entries] = await Promise.all([
			listCounters(),
			db.entries.orderBy(':id').toArray()
		]);
		return { app: APP_ID, schemaVersion: SCHEMA_VERSION, exportedAt: at ?? Date.now(), counters, entries };
	});
}

/** Replaces everything. Assumes `backup` has already been validated. */
export async function importAll(backup: Backup): Promise<void> {
	await db.transaction('rw', db.counters, db.entries, async () => {
		await db.counters.clear();
		await db.entries.clear();
		await db.counters.bulkAdd(backup.counters);
		await db.entries.bulkAdd(backup.entries);
	});
}
