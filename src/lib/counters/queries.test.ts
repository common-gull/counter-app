import { beforeEach, describe, expect, it } from 'vitest';
import { logEntry } from '../entries/queries';
import { exportAll } from '../backup/backup';
import { resetDatabase } from '../testing/reset-db';
import { addCounter, deleteCounter, getCounter, listCounters, renameCounter } from './queries';

const T0 = 1_750_000_000_000;

beforeEach(resetDatabase);

describe('counters', () => {
	it('starts empty', async () => {
		expect(await listCounters()).toEqual([]);
	});

	it('stores a counter', async () => {
		await addCounter({ name: 'Cat treats' }, T0);
		expect(await listCounters()).toMatchObject([{ name: 'Cat treats', createdAt: T0 }]);
	});

	it('stores an optional unit', async () => {
		await addCounter({ name: 'Water', unit: 'cups' }, T0);
		const [counter] = await listCounters();
		expect(counter!.unit).toBe('cups');
	});

	it('omits the unit when not given', async () => {
		await addCounter({ name: 'Treats' }, T0);
		const [counter] = await listCounters();
		expect(counter).not.toHaveProperty('unit');
	});

	it('defaults createdAt to now', async () => {
		const before = Date.now();
		await addCounter({ name: 'Now' });
		const [counter] = await listCounters();
		expect(counter!.createdAt).toBeGreaterThanOrEqual(before);
	});

	it('assigns distinct ids', async () => {
		const first = await addCounter({ name: 'First' }, T0);
		const second = await addCounter({ name: 'Second' }, T0);
		expect(first).not.toBe(second);
	});

	it('keeps insertion order', async () => {
		await addCounter({ name: 'First' }, T0);
		await addCounter({ name: 'Second' }, T0);
		await addCounter({ name: 'Third' }, T0);
		expect((await listCounters()).map((c) => c.name)).toEqual(['First', 'Second', 'Third']);
	});

	it('gets a counter by id', async () => {
		const id = await addCounter({ name: 'Cat treats' }, T0);
		expect(await getCounter(id)).toMatchObject({ id, name: 'Cat treats' });
	});

	it('returns undefined for an unknown id', async () => {
		expect(await getCounter(9999)).toBeUndefined();
	});

	it('renames a counter', async () => {
		const id = await addCounter({ name: 'Treets' }, T0);
		await renameCounter(id, 'Treats');
		expect((await listCounters())[0]!.name).toBe('Treats');
	});

	it('ignores a rename of an unknown id', async () => {
		await addCounter({ name: 'Kept' }, T0);
		await renameCounter(9999, 'Ghost');
		expect((await listCounters()).map((c) => c.name)).toEqual(['Kept']);
	});

	it('deletes a counter', async () => {
		const id = await addCounter({ name: 'Doomed' }, T0);
		await deleteCounter(id);
		expect(await listCounters()).toEqual([]);
	});

	it('cascades the delete to that counters entries', async () => {
		const id = await addCounter({ name: 'Doomed' }, T0);
		await logEntry(id, 1, T0);
		await logEntry(id, 2, T0);
		await deleteCounter(id);
		expect((await exportAll(T0)).entries).toEqual([]);
	});

	it('leaves other counters entries alone', async () => {
		const doomed = await addCounter({ name: 'Doomed' }, T0);
		const kept = await addCounter({ name: 'Kept' }, T0);
		await logEntry(doomed, 1, T0);
		await logEntry(kept, 7, T0);
		await deleteCounter(doomed);
		expect((await exportAll(T0)).entries.map((e) => e.amount)).toEqual([7]);
	});
});
