import { beforeEach, describe, expect, it } from 'vitest';
import { addCounter, listCounters } from '../counters/queries';
import { listEntries, logEntry } from '../entries/queries';
import { resetDatabase } from '../testing/reset-db';
import { exportAll, importAll } from './backup';
import { APP_ID, SCHEMA_VERSION } from './types';

const T0 = 1_750_000_000_000;
const HOUR = 60 * 60_000;

beforeEach(resetDatabase);

describe('backup', () => {
	it('stamps the app id and schema version', async () => {
		expect(await exportAll(T0)).toMatchObject({
			app: APP_ID,
			schemaVersion: SCHEMA_VERSION,
			exportedAt: T0
		});
	});

	it('defaults exportedAt to now', async () => {
		const before = Date.now();
		expect((await exportAll()).exportedAt).toBeGreaterThanOrEqual(before);
	});

	it('round-trips counters and entries', async () => {
		const counterId = await addCounter({ name: 'Treats', unit: 'treats' }, T0);
		await logEntry(counterId, 2, T0);
		await logEntry(counterId, 3, T0 + HOUR);
		const exported = await exportAll(T0);

		await importAll(exported);

		expect(await exportAll(T0)).toEqual(exported);
	});

	it('replaces existing data rather than merging', async () => {
		const original = await addCounter({ name: 'Original' }, T0);
		await logEntry(original, 1, T0);
		const snapshot = await exportAll(T0);

		await addCounter({ name: 'Added later' }, T0);
		await importAll(snapshot);

		expect((await listCounters()).map((c) => c.name)).toEqual(['Original']);
	});

	it('keeps issuing usable ids after an import', async () => {
		const counterId = await addCounter({ name: 'Treats' }, T0);
		await logEntry(counterId, 1, T0);
		const snapshot = await exportAll(T0);
		await importAll(snapshot);

		// An id colliding with an imported row would overwrite it.
		const freshCounter = await addCounter({ name: 'Fresh' }, T0);
		const freshEntry = await logEntry(freshCounter, 1, T0);

		expect(await listCounters()).toHaveLength(2);
		expect(await listEntries(freshCounter)).toMatchObject([{ id: freshEntry }]);
	});
});
