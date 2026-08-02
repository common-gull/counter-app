import { describe, expect, it } from 'vitest';
import {
	formatCount,
	formatDayHeading,
	formatTimeOfDay,
	fromDateTimeLocal,
	toDateTimeLocal
} from './format';

const EDT = '-04:00';
const EST = '-05:00';
const NOW = new Date(`2025-06-18T12:00:00${EDT}`);
const ts = (iso: string) => new Date(iso).getTime();

describe('formatCount', () => {
	it('leaves a small number alone', () => {
		expect(formatCount(5, 'en-US')).toBe('5');
	});

	it('groups thousands', () => {
		expect(formatCount(1234, 'en-US')).toBe('1,234');
	});

	it('groups a very large number', () => {
		expect(formatCount(1234123412470, 'en-US')).toBe('1,234,123,412,470');
	});

	it('keeps a fractional amount', () => {
		expect(formatCount(1.5, 'en-US')).toBe('1.5');
	});

	it('formats zero', () => {
		expect(formatCount(0, 'en-US')).toBe('0');
	});
});

describe('formatTimeOfDay', () => {
	it('formats in local time', () => {
		expect(formatTimeOfDay(ts(`2025-06-18T14:30:00${EDT}`), 'en-US')).toBe('2:30 PM');
	});

	it('uses the local day, not UTC', () => {
		// 01:30Z is 21:30 the previous evening in New York.
		expect(formatTimeOfDay(ts('2025-06-19T01:30:00Z'), 'en-US')).toBe('9:30 PM');
	});
});

describe('toDateTimeLocal', () => {
	it('formats in local time, zero-padded', () => {
		expect(toDateTimeLocal(ts(`2025-06-05T09:07:00${EDT}`))).toBe('2025-06-05T09:07');
	});

	it('uses the local day, not UTC', () => {
		// 01:30Z is 21:30 the previous evening in New York.
		expect(toDateTimeLocal(ts('2025-06-19T01:30:00Z'))).toBe('2025-06-18T21:30');
	});
});

describe('fromDateTimeLocal', () => {
	it('parses as local time, not UTC', () => {
		expect(fromDateTimeLocal('2025-06-18T14:30')).toBe(ts(`2025-06-18T14:30:00${EDT}`));
	});

	it('accepts a seconds component', () => {
		expect(fromDateTimeLocal('2025-06-18T14:30:00')).toBe(ts(`2025-06-18T14:30:00${EDT}`));
	});

	it('rejects an empty string', () => {
		expect(fromDateTimeLocal('')).toBeNull();
	});

	it('rejects a malformed value', () => {
		expect(fromDateTimeLocal('18/06/2025 2:30pm')).toBeNull();
	});

	it('rejects an impossible date', () => {
		expect(fromDateTimeLocal('2025-02-30T14:30')).toBeNull();
	});

	it('round-trips to the minute', () => {
		const original = ts(`2025-06-18T14:30:00${EDT}`);
		expect(fromDateTimeLocal(toDateTimeLocal(original))).toBe(original);
	});

	it('rejects a local time that DST skipped', () => {
		// Clocks jump 02:00 -> 03:00 on 2025-03-09, so 02:30 never happens.
		expect(fromDateTimeLocal('2025-03-09T02:30')).toBeNull();
	});

	it('resolves an ambiguous fall-back time to the earlier instant', () => {
		// 01:30 happens twice on 2025-11-02; the input cannot distinguish them.
		expect(fromDateTimeLocal('2025-11-02T01:30')).toBe(ts(`2025-11-02T01:30:00${EDT}`));
	});
});

describe('formatDayHeading', () => {
	it('calls the current day Today', () => {
		expect(formatDayHeading(ts(`2025-06-18T08:00:00${EDT}`), NOW, 'en-US')).toBe('Today');
	});

	it('calls the previous day Yesterday', () => {
		expect(formatDayHeading(ts(`2025-06-17T23:00:00${EDT}`), NOW, 'en-US')).toBe('Yesterday');
	});

	it('formats older days as a short date', () => {
		expect(formatDayHeading(ts(`2025-06-15T08:00:00${EDT}`), NOW, 'en-US')).toBe('Sun, Jun 15');
	});

	it('does not call a future day Yesterday', () => {
		expect(formatDayHeading(ts(`2025-06-19T08:00:00${EDT}`), NOW, 'en-US')).not.toBe('Yesterday');
	});

	it('handles Yesterday across the fall-back DST boundary', () => {
		// 2025-11-02 is 25 hours long; "yesterday" must still be the 1st.
		const nowAfterChange = new Date(`2025-11-03T10:00:00${EST}`);
		expect(formatDayHeading(ts(`2025-11-02T23:00:00${EST}`), nowAfterChange, 'en-US')).toBe(
			'Yesterday'
		);
	});

	it('handles Yesterday across a month boundary', () => {
		const firstOfMonth = new Date(`2025-07-01T10:00:00${EDT}`);
		expect(formatDayHeading(ts(`2025-06-30T22:00:00${EDT}`), firstOfMonth, 'en-US')).toBe(
			'Yesterday'
		);
	});
});
