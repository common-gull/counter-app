import { dayKey, startOfLocalDay } from './time';

/**
 * Display formatting. `locale` defaults to the browser's; tests pass one explicitly so
 * assertions don't depend on the machine's locale.
 */

export function formatTimeOfDay(ts: number, locale?: string): string {
	return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(ts);
}

/** "Today", "Yesterday", or a short date. */
export function formatDayHeading(ts: number, now: Date, locale?: string): string {
	const key = dayKey(ts);
	if (key === dayKey(now.getTime())) return 'Today';

	const yesterday = new Date(startOfLocalDay(now));
	yesterday.setDate(yesterday.getDate() - 1);
	if (key === dayKey(yesterday.getTime())) return 'Yesterday';

	return new Intl.DateTimeFormat(locale, {
		weekday: 'short',
		day: 'numeric',
		month: 'short'
	}).format(ts);
}
