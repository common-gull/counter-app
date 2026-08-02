import { beforeEach, describe, expect, it } from 'vitest';
import { addCounter } from '../counters/queries';
import { resetDatabase } from '../testing/reset-db';
import {
	countEntries,
	deleteEntry,
	listEntries,
	logEntry,
	totalBetween,
	updateEntry
} from './queries';

const T0 = 1_750_000_000_000;
const HOUR = 60 * 60_000;
const DAY = 24 * HOUR;

beforeEach(resetDatabase);

describe('entries', () => {
	it('stores amount and timestamp', async () => {
		const counterId = await addCounter({ name: 'Treats' }, T0);
		await logEntry(counterId, 3, T0);
		expect(await listEntries(counterId)).toMatchObject([{ counterId, amount: 3, timestamp: T0 }]);
	});

	it('defaults the timestamp to now', async () => {
		const counterId = await addCounter({ name: 'Treats' }, T0);
		const before = Date.now();
		await logEntry(counterId, 1);
		const [entry] = await listEntries(counterId);
		expect(entry!.timestamp).toBeGreaterThanOrEqual(before);
	});

	it('returns entries newest first', async () => {
		const counterId = await addCounter({ name: 'Treats' }, T0);
		await logEntry(counterId, 1, T0);
		await logEntry(counterId, 2, T0 + HOUR);
		await logEntry(counterId, 3, T0 - HOUR);
		expect((await listEntries(counterId)).map((e) => e.amount)).toEqual([2, 1, 3]);
	});

	it('honours the limit', async () => {
		const counterId = await addCounter({ name: 'Treats' }, T0);
		await logEntry(counterId, 1, T0);
		await logEntry(counterId, 2, T0 + HOUR);
		await logEntry(counterId, 3, T0 + 2 * HOUR);
		expect((await listEntries(counterId, 2)).map((e) => e.amount)).toEqual([3, 2]);
	});

	it('only returns the requested counter', async () => {
		const treats = await addCounter({ name: 'Treats' }, T0);
		const water = await addCounter({ name: 'Water' }, T0);
		await logEntry(treats, 1, T0);
		await logEntry(water, 99, T0);
		expect((await listEntries(treats)).map((e) => e.amount)).toEqual([1]);
	});

	it('patches the amount without touching the timestamp', async () => {
		const counterId = await addCounter({ name: 'Treats' }, T0);
		const entryId = await logEntry(counterId, 3, T0);
		await updateEntry(entryId, { amount: 5 });
		expect((await listEntries(counterId))[0]).toMatchObject({ amount: 5, timestamp: T0 });
	});

	it('patches the timestamp without touching the amount', async () => {
		const counterId = await addCounter({ name: 'Treats' }, T0);
		const entryId = await logEntry(counterId, 3, T0);
		await updateEntry(entryId, { timestamp: T0 + HOUR });
		expect((await listEntries(counterId))[0]).toMatchObject({ amount: 3, timestamp: T0 + HOUR });
	});

	it('ignores an empty patch', async () => {
		const counterId = await addCounter({ name: 'Treats' }, T0);
		const entryId = await logEntry(counterId, 3, T0);
		await updateEntry(entryId, {});
		expect((await listEntries(counterId))[0]).toMatchObject({ amount: 3, timestamp: T0 });
	});

	it('ignores a patch to an unknown id', async () => {
		const counterId = await addCounter({ name: 'Treats' }, T0);
		await logEntry(counterId, 3, T0);
		await updateEntry(9999, { amount: 100 });
		expect((await listEntries(counterId))[0]!.amount).toBe(3);
	});

	it('counts the entries of one counter', async () => {
		const treats = await addCounter({ name: 'Treats' }, T0);
		const water = await addCounter({ name: 'Water' }, T0);
		await logEntry(treats, 1, T0);
		await logEntry(treats, 2, T0);
		await logEntry(water, 3, T0);
		expect(await countEntries(treats)).toBe(2);
	});

	it('counts zero for a counter with no entries', async () => {
		const counterId = await addCounter({ name: 'Empty' }, T0);
		expect(await countEntries(counterId)).toBe(0);
	});

	it('deletes an entry', async () => {
		const counterId = await addCounter({ name: 'Treats' }, T0);
		const entryId = await logEntry(counterId, 3, T0);
		await deleteEntry(entryId);
		expect(await listEntries(counterId)).toEqual([]);
	});
});

describe('totalBetween', () => {
	const range = { from: T0, to: T0 + DAY };

	it('sums amounts inside the range', async () => {
		const counterId = await addCounter({ name: 'Treats' }, T0);
		await logEntry(counterId, 2, T0 + HOUR);
		await logEntry(counterId, 3, T0 + 2 * HOUR);
		expect(await totalBetween(counterId, range)).toBe(5);
	});

	it('includes an entry exactly at `from`', async () => {
		const counterId = await addCounter({ name: 'Treats' }, T0);
		await logEntry(counterId, 4, range.from);
		expect(await totalBetween(counterId, range)).toBe(4);
	});

	it('excludes an entry exactly at `to`', async () => {
		const counterId = await addCounter({ name: 'Treats' }, T0);
		await logEntry(counterId, 4, range.to);
		expect(await totalBetween(counterId, range)).toBe(0);
	});

	it('excludes entries before the range', async () => {
		const counterId = await addCounter({ name: 'Treats' }, T0);
		await logEntry(counterId, 9, range.from - 1);
		await logEntry(counterId, 1, range.from);
		expect(await totalBetween(counterId, range)).toBe(1);
	});

	it('ignores other counters', async () => {
		const treats = await addCounter({ name: 'Treats' }, T0);
		const water = await addCounter({ name: 'Water' }, T0);
		await logEntry(treats, 2, T0 + HOUR);
		await logEntry(water, 50, T0 + HOUR);
		expect(await totalBetween(treats, range)).toBe(2);
	});

	it('is zero when there are no entries', async () => {
		const counterId = await addCounter({ name: 'Treats' }, T0);
		expect(await totalBetween(counterId, range)).toBe(0);
	});
});
