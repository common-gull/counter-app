import { dayKey, startOfLocalDay } from './time';

/**
 * Display formatting. `locale` defaults to the browser's; tests pass one explicitly so
 * assertions don't depend on the machine's locale.
 *
 * Formatters are cached per locale. Constructing an Intl formatter costs roughly forty
 * times more than using one, and these run for every history row on every write.
 */

const numberFormats = new Map<string | undefined, Intl.NumberFormat>();
const timeFormats = new Map<string | undefined, Intl.DateTimeFormat>();
const dateFormats = new Map<string | undefined, Intl.DateTimeFormat>();

function cached<T>(cache: Map<string | undefined, T>, locale: string | undefined, make: () => T): T {
	let formatter = cache.get(locale);
	if (formatter === undefined) cache.set(locale, (formatter = make()));
	return formatter;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Thousands separators, so a large total stays readable. */
export function formatCount(value: number, locale?: string): string {
	return cached(numberFormats, locale, () => new Intl.NumberFormat(locale)).format(value);
}

export function formatTimeOfDay(ts: number, locale?: string): string {
	const format = cached(
		timeFormats,
		locale,
		() => new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' })
	);
	return format.format(ts);
}

/** Local `YYYY-MM-DDTHH:mm`, the value format an `<input type="datetime-local">` wants. */
export function toDateTimeLocal(ts: number): string {
	const d = new Date(ts);
	return `${dayKey(ts)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Parses that same format back to UTC epoch ms, or null if it isn't one.
 *
 * A date-time string with no offset is parsed as local time, which is exactly what
 * the input means — don't "fix" this by appending Z.
 *
 * DST: a local time that does not exist (02:30 on a spring-forward morning) is
 * rejected, because re-formatting the parsed value no longer matches the input. A
 * local time that happens twice (01:30 on a fall-back morning) resolves to the
 * earlier of the two instants; `datetime-local` has no way to say which was meant.
 */
export function fromDateTimeLocal(value: string): number | null {
	if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(value)) return null;

	const ts = new Date(value).getTime();
	if (!Number.isFinite(ts)) return null;

	// JS rolls impossible dates forward (Feb 30 becomes Mar 2), so reject anything
	// that doesn't format back to what was typed.
	return toDateTimeLocal(ts) === value.slice(0, 16) ? ts : null;
}

/** "Today", "Yesterday", or a short date. */
export function formatDayHeading(ts: number, now: Date, locale?: string): string {
	const key = dayKey(ts);
	if (key === dayKey(now.getTime())) return 'Today';

	const yesterday = new Date(startOfLocalDay(now));
	yesterday.setDate(yesterday.getDate() - 1);
	if (key === dayKey(yesterday.getTime())) return 'Yesterday';

	const format = cached(
		dateFormats,
		locale,
		() => new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' })
	);
	return format.format(ts);
}
