import { describe, it, expect } from 'vitest';
import {
	dayKey,
	endOfLocalDay,
	endOfLocalMonth,
	endOfLocalWeek,
	rangeFor,
	startOfLocalDay,
	startOfLocalMonth,
	startOfLocalWeek
} from './time';

const HOUR = 60 * 60 * 1000;

/** Offsets are written explicitly so each fixture means one unambiguous instant. */
const EDT = '-04:00'; // America/New_York, daylight saving
const EST = '-05:00'; // America/New_York, standard

describe('test environment', () => {
	it('runs in the pinned America/New_York timezone', () => {
		// Guards every assertion below: if the `env: { TZ }` setting on the server test
		// project in vite.config.ts is lost, this fails first and explains why.
		expect(new Date('2025-06-15T12:00:00Z').getHours()).toBe(8);
	});
});

describe('startOfLocalDay', () => {
	it('rewinds to local midnight', () => {
		expect(startOfLocalDay(new Date(`2025-06-15T14:32:07${EDT}`))).toBe(
			new Date(`2025-06-15T00:00:00${EDT}`).getTime()
		);
	});

	it('is idempotent at midnight itself', () => {
		const midnight = new Date(`2025-06-15T00:00:00${EDT}`);
		expect(startOfLocalDay(midnight)).toBe(midnight.getTime());
	});

	it('uses the local day, not the UTC day', () => {
		// 02:00Z on the 15th is still 22:00 on the 14th in New York.
		expect(startOfLocalDay(new Date('2025-06-15T02:00:00Z'))).toBe(
			new Date(`2025-06-14T00:00:00${EDT}`).getTime()
		);
	});

	it('does not mutate its argument', () => {
		const d = new Date(`2025-06-15T14:32:07${EDT}`);
		const before = d.getTime();
		startOfLocalDay(d);
		expect(d.getTime()).toBe(before);
	});
});

describe('endOfLocalDay', () => {
	it('is the exclusive start of the next day', () => {
		expect(endOfLocalDay(new Date(`2025-06-15T14:32:07${EDT}`))).toBe(
			new Date(`2025-06-16T00:00:00${EDT}`).getTime()
		);
	});

	it('crosses a month boundary', () => {
		expect(endOfLocalDay(new Date(`2025-01-31T09:00:00${EST}`))).toBe(
			new Date(`2025-02-01T00:00:00${EST}`).getTime()
		);
	});

	it('crosses a year boundary', () => {
		expect(endOfLocalDay(new Date(`2024-12-31T23:59:59${EST}`))).toBe(
			new Date(`2025-01-01T00:00:00${EST}`).getTime()
		);
	});
});

describe('DST transitions', () => {
	it('gives a 23-hour day when clocks spring forward', () => {
		const springForward = new Date(`2025-03-09T12:00:00${EDT}`);
		const length = endOfLocalDay(springForward) - startOfLocalDay(springForward);
		expect(length).toBe(23 * HOUR);
	});

	it('gives a 25-hour day when clocks fall back', () => {
		const fallBack = new Date(`2025-11-02T12:00:00${EST}`);
		const length = endOfLocalDay(fallBack) - startOfLocalDay(fallBack);
		expect(length).toBe(25 * HOUR);
	});

	it('still starts the spring-forward day at local midnight', () => {
		expect(startOfLocalDay(new Date(`2025-03-09T12:00:00${EDT}`))).toBe(
			new Date(`2025-03-09T00:00:00${EST}`).getTime()
		);
	});

	it('gives a 167-hour week containing the spring-forward day', () => {
		// Sunday 2025-03-09 is the transition, so the affected week is Mon the 3rd
		// through Mon the 10th — a week that *starts* on the 10th is a normal 168.
		const inThatWeek = new Date(`2025-03-05T08:00:00${EST}`);
		expect(endOfLocalWeek(inThatWeek) - startOfLocalWeek(inThatWeek)).toBe(167 * HOUR);
	});

	it('gives a 169-hour week containing the fall-back day', () => {
		// Likewise Sunday 2025-11-02 falls in the week beginning Mon 2025-10-27.
		const inThatWeek = new Date(`2025-10-29T08:00:00${EDT}`);
		expect(endOfLocalWeek(inThatWeek) - startOfLocalWeek(inThatWeek)).toBe(169 * HOUR);
	});
});

describe('startOfLocalWeek', () => {
	it('rewinds a midweek day to Monday', () => {
		// 2025-06-18 is a Wednesday.
		expect(startOfLocalWeek(new Date(`2025-06-18T14:00:00${EDT}`))).toBe(
			new Date(`2025-06-16T00:00:00${EDT}`).getTime()
		);
	});

	it('treats Sunday as the last day of the week, not the first', () => {
		// 2025-06-22 is a Sunday; its week began Monday the 16th.
		expect(startOfLocalWeek(new Date(`2025-06-22T23:00:00${EDT}`))).toBe(
			new Date(`2025-06-16T00:00:00${EDT}`).getTime()
		);
	});

	it('is idempotent on Monday at midnight', () => {
		const monday = new Date(`2025-06-16T00:00:00${EDT}`);
		expect(startOfLocalWeek(monday)).toBe(monday.getTime());
	});

	it('reaches back into the previous year', () => {
		// 2025-01-01 is a Wednesday; its week began Monday 2024-12-30.
		expect(startOfLocalWeek(new Date(`2025-01-01T12:00:00${EST}`))).toBe(
			new Date(`2024-12-30T00:00:00${EST}`).getTime()
		);
	});
});

describe('endOfLocalWeek', () => {
	it('is the exclusive following Monday', () => {
		expect(endOfLocalWeek(new Date(`2025-06-18T14:00:00${EDT}`))).toBe(
			new Date(`2025-06-23T00:00:00${EDT}`).getTime()
		);
	});
});

describe('startOfLocalMonth', () => {
	it('rewinds to the first of the month at midnight', () => {
		expect(startOfLocalMonth(new Date(`2025-06-18T14:00:00${EDT}`))).toBe(
			new Date(`2025-06-01T00:00:00${EDT}`).getTime()
		);
	});

	it('is idempotent on the first at midnight', () => {
		const first = new Date(`2025-06-01T00:00:00${EDT}`);
		expect(startOfLocalMonth(first)).toBe(first.getTime());
	});
});

describe('endOfLocalMonth', () => {
	it('does not overshoot from a 31-day month into the month after next', () => {
		// The classic setMonth trap: Jan 31 + 1 month is March 3 if the day isn't reset.
		expect(endOfLocalMonth(new Date(`2025-01-31T23:00:00${EST}`))).toBe(
			new Date(`2025-02-01T00:00:00${EST}`).getTime()
		);
	});

	it('handles a leap February', () => {
		const feb = new Date(`2024-02-15T12:00:00${EST}`);
		expect(endOfLocalMonth(feb)).toBe(new Date(`2024-03-01T00:00:00${EST}`).getTime());
	});

	it('spans 29 days in a leap February', () => {
		const feb = new Date(`2024-02-15T12:00:00${EST}`);
		// 29 days minus the hour lost to the March 10 DST change... which is in March,
		// so February is a clean 29 * 24.
		expect(endOfLocalMonth(feb) - startOfLocalMonth(feb)).toBe(29 * 24 * HOUR);
	});

	it('spans 28 days in a common February', () => {
		const feb = new Date(`2025-02-15T12:00:00${EST}`);
		expect(endOfLocalMonth(feb) - startOfLocalMonth(feb)).toBe(28 * 24 * HOUR);
	});

	it('rolls from December into the next year', () => {
		expect(endOfLocalMonth(new Date(`2025-12-15T12:00:00${EST}`))).toBe(
			new Date(`2026-01-01T00:00:00${EST}`).getTime()
		);
	});
});

describe('rangeFor', () => {
	const noon = new Date(`2025-06-18T12:00:00${EDT}`);

	it('returns the day range', () => {
		expect(rangeFor('day', noon)).toEqual({
			from: startOfLocalDay(noon),
			to: endOfLocalDay(noon)
		});
	});

	it('returns the week range', () => {
		expect(rangeFor('week', noon)).toEqual({
			from: startOfLocalWeek(noon),
			to: endOfLocalWeek(noon)
		});
	});

	it('returns the month range', () => {
		expect(rangeFor('month', noon)).toEqual({
			from: startOfLocalMonth(noon),
			to: endOfLocalMonth(noon)
		});
	});

	it('nests day inside week inside month', () => {
		const day = rangeFor('day', noon);
		const week = rangeFor('week', noon);
		const month = rangeFor('month', noon);
		expect(week.from <= day.from && day.to <= week.to).toBe(true);
		expect(month.from <= day.from && day.to <= month.to).toBe(true);
	});

	it('excludes the instant at `to`', () => {
		const { to } = rangeFor('day', noon);
		// The upper bound belongs to the next day's range, never to this one.
		expect(rangeFor('day', new Date(to)).from).toBe(to);
	});
});

describe('dayKey', () => {
	it('formats as zero-padded YYYY-MM-DD', () => {
		expect(dayKey(new Date(`2025-06-05T14:00:00${EDT}`).getTime())).toBe('2025-06-05');
	});

	it('uses the local date, not the UTC date', () => {
		// 01:30Z on the 5th is 21:30 on the 4th in New York.
		expect(dayKey(new Date('2025-06-05T01:30:00Z').getTime())).toBe('2025-06-04');
	});

	it('agrees with startOfLocalDay across a day boundary', () => {
		const lastMoment = new Date(`2025-06-15T23:59:59.999${EDT}`).getTime();
		const firstMoment = endOfLocalDay(new Date(lastMoment));
		expect([dayKey(lastMoment), dayKey(firstMoment)]).toEqual(['2025-06-15', '2025-06-16']);
	});
});
