import { describe, expect, it } from 'vitest';
import { groupByDay } from './group';
import type { Entry } from './types';

const EDT = '-04:00';
const at = (iso: string, id = 1, amount = 1): Entry => ({
	id,
	counterId: 1,
	amount,
	timestamp: new Date(iso).getTime()
});

describe('groupByDay', () => {
	it('returns nothing for no entries', () => {
		expect(groupByDay([])).toEqual([]);
	});

	it('puts entries from one day in a single group', () => {
		const groups = groupByDay([
			at(`2025-06-18T20:00:00${EDT}`, 1),
			at(`2025-06-18T09:00:00${EDT}`, 2)
		]);
		expect(groups).toHaveLength(1);
		expect(groups[0]!.entries).toHaveLength(2);
	});

	it('splits entries across days', () => {
		const groups = groupByDay([
			at(`2025-06-18T09:00:00${EDT}`, 1),
			at(`2025-06-17T09:00:00${EDT}`, 2)
		]);
		expect(groups.map((g) => g.key)).toEqual(['2025-06-18', '2025-06-17']);
	});

	it('keeps the incoming order', () => {
		const groups = groupByDay([
			at(`2025-06-18T09:00:00${EDT}`, 1, 10),
			at(`2025-06-18T08:00:00${EDT}`, 2, 20),
			at(`2025-06-17T09:00:00${EDT}`, 3, 30)
		]);
		expect(groups.flatMap((g) => g.entries.map((e) => e.amount))).toEqual([10, 20, 30]);
	});

	it('groups by local day, not UTC day', () => {
		// 01:00Z on the 19th is 21:00 on the 18th in New York, so both are the 18th.
		const groups = groupByDay([at('2025-06-19T01:00:00Z', 1), at(`2025-06-18T09:00:00${EDT}`, 2)]);
		expect(groups.map((g) => g.key)).toEqual(['2025-06-18']);
	});

	it('starts a new group when the day repeats non-consecutively', () => {
		// Defensive: out-of-order input should not silently merge distant days.
		const groups = groupByDay([
			at(`2025-06-18T09:00:00${EDT}`, 1),
			at(`2025-06-17T09:00:00${EDT}`, 2),
			at(`2025-06-18T08:00:00${EDT}`, 3)
		]);
		expect(groups.map((g) => g.key)).toEqual(['2025-06-18', '2025-06-17', '2025-06-18']);
	});

	it('takes the heading timestamp from the first entry of the group', () => {
		const first = at(`2025-06-18T20:00:00${EDT}`, 1);
		const groups = groupByDay([first, at(`2025-06-18T09:00:00${EDT}`, 2)]);
		expect(groups[0]!.timestamp).toBe(first.timestamp);
	});
});
