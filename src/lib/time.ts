/**
 * Local-time bucketing for UTC timestamps.
 *
 * Entries are stored as UTC epoch milliseconds; every day/week/month boundary is
 * derived here in the browser's local timezone. All functions take an explicit
 * `Date` rather than reading the clock, so callers (and tests) control the instant.
 *
 * Boundaries are half-open: `from` is inclusive, `to` is exclusive. An entry logged
 * exactly at midnight belongs to the day that is starting, not the one that ended.
 *
 * These are built on Date's local component setters, never on epoch arithmetic — a
 * local day is 23 or 25 hours long across a DST transition, so `ts - (ts % 86400000)`
 * is wrong twice a year.
 */

/** 0 = Sunday, 1 = Monday. Change here to reweek the whole app. */
export const WEEK_STARTS_ON = 1;

export type Period = 'day' | 'week' | 'month';

export interface Range {
	/** inclusive */
	from: number;
	/** exclusive */
	to: number;
}

export function startOfLocalDay(d: Date): number {
	const x = new Date(d);
	x.setHours(0, 0, 0, 0);
	return x.getTime();
}

export function endOfLocalDay(d: Date): number {
	const x = new Date(startOfLocalDay(d));
	x.setDate(x.getDate() + 1);
	return x.getTime();
}

export function startOfLocalWeek(d: Date): number {
	const x = new Date(startOfLocalDay(d));
	const shift = (x.getDay() - WEEK_STARTS_ON + 7) % 7;
	x.setDate(x.getDate() - shift);
	return x.getTime();
}

export function endOfLocalWeek(d: Date): number {
	const x = new Date(startOfLocalWeek(d));
	x.setDate(x.getDate() + 7);
	return x.getTime();
}

export function startOfLocalMonth(d: Date): number {
	const x = new Date(startOfLocalDay(d));
	x.setDate(1);
	return x.getTime();
}

export function endOfLocalMonth(d: Date): number {
	// Day-of-month is set to 1 before advancing, otherwise Jan 31 + 1 month lands in March.
	const x = new Date(startOfLocalMonth(d));
	x.setMonth(x.getMonth() + 1);
	return x.getTime();
}

export function rangeFor(period: Period, d: Date): Range {
	switch (period) {
		case 'day':
			return { from: startOfLocalDay(d), to: endOfLocalDay(d) };
		case 'week':
			return { from: startOfLocalWeek(d), to: endOfLocalWeek(d) };
		case 'month':
			return { from: startOfLocalMonth(d), to: endOfLocalMonth(d) };
	}
}

/** `YYYY-MM-DD` in local time — the grouping key for the entry history list. */
export function dayKey(ts: number): string {
	const d = new Date(ts);
	const month = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${d.getFullYear()}-${month}-${day}`;
}
