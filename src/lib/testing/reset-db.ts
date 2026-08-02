import { db } from '../db';

/** Fresh tables between tests. Auto-increment ids intentionally keep climbing. */
export async function resetDatabase(): Promise<void> {
	await db.counters.clear();
	await db.entries.clear();
}
