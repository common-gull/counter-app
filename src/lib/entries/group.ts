import { dayKey } from '../time';
import type { Entry } from './types';

export interface DayGroup {
	/** `YYYY-MM-DD` in local time. */
	key: string;
	/** The timestamp of the first entry in the group, for formatting the heading. */
	timestamp: number;
	entries: Entry[];
	/** Sum of the day's amounts, shown beside the heading. */
	total: number;
}

/**
 * Buckets entries into local days, preserving the order they arrive in (the history
 * list is newest first, and so are the groups).
 */
export function groupByDay(entries: Entry[]): DayGroup[] {
	const groups: DayGroup[] = [];

	for (const entry of entries) {
		const key = dayKey(entry.timestamp);
		const current = groups.at(-1);
		if (current?.key === key) {
			current.entries.push(entry);
			current.total += entry.amount;
		} else {
			groups.push({ key, timestamp: entry.timestamp, entries: [entry], total: entry.amount });
		}
	}

	return groups;
}
