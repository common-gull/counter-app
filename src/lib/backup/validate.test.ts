import { describe, expect, it } from 'vitest';
import { APP_ID, SCHEMA_VERSION, type Backup } from './types';
import { parseBackup } from './validate';

const T0 = 1_750_000_000_000;

const valid: Backup = {
	app: APP_ID,
	schemaVersion: SCHEMA_VERSION,
	exportedAt: T0,
	counters: [{ id: 1, name: 'Cat treats', createdAt: T0, sortOrder: 0 }],
	entries: [{ id: 1, counterId: 1, amount: 3, timestamp: T0 }]
};

const serialise = (value: unknown) => JSON.stringify(value);

describe('parseBackup', () => {
	it('accepts a well-formed backup', () => {
		expect(parseBackup(serialise(valid))).toEqual({ ok: true, value: valid });
	});

	it('accepts a backup with no counters or entries', () => {
		expect(parseBackup(serialise({ ...valid, counters: [], entries: [] }))).toMatchObject({
			ok: true
		});
	});

	it('accepts an older schema version', () => {
		expect(parseBackup(serialise({ ...valid, schemaVersion: 0 }))).toMatchObject({ ok: true });
	});

	it('keeps the optional unit', () => {
		const withUnit = {
			...valid,
			counters: [{ ...valid.counters[0]!, unit: 'treats' }]
		};
		const result = parseBackup(serialise(withUnit));
		expect(result.ok && result.value.counters[0]!.unit).toBe('treats');
	});

	it('rejects invalid JSON', () => {
		expect(parseBackup('{ not json')).toMatchObject({ ok: false });
	});

	it('rejects a JSON array', () => {
		expect(parseBackup('[]')).toMatchObject({ ok: false });
	});

	it('rejects null', () => {
		expect(parseBackup('null')).toMatchObject({ ok: false });
	});

	it('rejects a file from another app', () => {
		expect(parseBackup(serialise({ ...valid, app: 'todo-app' }))).toMatchObject({ ok: false });
	});

	it('rejects a missing version', () => {
		const { schemaVersion: _dropped, ...rest } = valid;
		expect(parseBackup(serialise(rest))).toMatchObject({ ok: false });
	});

	it('rejects a version from a newer app', () => {
		const result = parseBackup(serialise({ ...valid, schemaVersion: SCHEMA_VERSION + 1 }));
		expect(result).toMatchObject({ ok: false });
		expect(result.ok === false && result.error).toMatch(/newer version/i);
	});

	it('rejects missing counters', () => {
		const { counters: _dropped, ...rest } = valid;
		expect(parseBackup(serialise(rest))).toMatchObject({ ok: false });
	});

	it('rejects counters that are not an array', () => {
		expect(parseBackup(serialise({ ...valid, counters: {} }))).toMatchObject({ ok: false });
	});

	it('rejects a counter with no name', () => {
		const broken = { ...valid, counters: [{ id: 1, createdAt: T0, sortOrder: 0 }] };
		expect(parseBackup(serialise(broken))).toMatchObject({ ok: false });
	});

	it('rejects a counter whose id is not a number', () => {
		const broken = { ...valid, counters: [{ ...valid.counters[0]!, id: 'one' }] };
		expect(parseBackup(serialise(broken))).toMatchObject({ ok: false });
	});

	it('rejects an entry missing its amount', () => {
		const broken = { ...valid, entries: [{ id: 1, counterId: 1, timestamp: T0 }] };
		expect(parseBackup(serialise(broken))).toMatchObject({ ok: false });
	});

	it('rejects an entry whose timestamp is null', () => {
		const broken = { ...valid, entries: [{ ...valid.entries[0]!, timestamp: null }] };
		expect(parseBackup(serialise(broken))).toMatchObject({ ok: false });
	});

	// Import is the second write path into these tables. Everything the forms refuse
	// has to be refused here too, or a hand-edited file walks straight past it.
	it('rejects a counter with an empty name', () => {
		const broken = { ...valid, counters: [{ ...valid.counters[0]!, name: '' }] };
		expect(parseBackup(serialise(broken))).toMatchObject({ ok: false });
	});

	it('rejects a counter whose name is only whitespace', () => {
		const broken = { ...valid, counters: [{ ...valid.counters[0]!, name: '   ' }] };
		expect(parseBackup(serialise(broken))).toMatchObject({ ok: false });
	});

	it('rejects a counter name past the length limit', () => {
		const broken = { ...valid, counters: [{ ...valid.counters[0]!, name: 'a'.repeat(61) }] };
		expect(parseBackup(serialise(broken))).toMatchObject({ ok: false });
	});

	it('trims a counter name rather than storing it padded', () => {
		const padded = { ...valid, counters: [{ ...valid.counters[0]!, name: '  Cat treats  ' }] };
		const result = parseBackup(serialise(padded));
		expect(result.ok && result.value.counters[0]!.name).toBe('Cat treats');
	});

	it('rejects a unit that is not a string', () => {
		const broken = { ...valid, counters: [{ ...valid.counters[0]!, unit: {} }] };
		expect(parseBackup(serialise(broken))).toMatchObject({ ok: false });
	});

	it('rejects a unit past the length limit', () => {
		const broken = { ...valid, counters: [{ ...valid.counters[0]!, unit: 'x'.repeat(17) }] };
		expect(parseBackup(serialise(broken))).toMatchObject({ ok: false });
	});

	it('drops an empty unit rather than storing one', () => {
		const blank = { ...valid, counters: [{ ...valid.counters[0]!, unit: '   ' }] };
		const result = parseBackup(serialise(blank));
		expect(result.ok && result.value.counters[0]).not.toHaveProperty('unit');
	});

	it('rejects a zero amount', () => {
		const broken = { ...valid, entries: [{ ...valid.entries[0]!, amount: 0 }] };
		expect(parseBackup(serialise(broken))).toMatchObject({ ok: false });
	});

	it('rejects a negative amount', () => {
		const broken = { ...valid, entries: [{ ...valid.entries[0]!, amount: -5 }] };
		expect(parseBackup(serialise(broken))).toMatchObject({ ok: false });
	});

	it('accepts a fractional amount', () => {
		const fractional = { ...valid, entries: [{ ...valid.entries[0]!, amount: 1.5 }] };
		expect(parseBackup(serialise(fractional))).toMatchObject({ ok: true });
	});

	it('rejects an entry whose counter is missing', () => {
		// Deleting a counter cascades, so the app never holds an orphaned entry.
		const orphaned = { ...valid, entries: [{ ...valid.entries[0]!, counterId: 999 }] };
		const result = parseBackup(serialise(orphaned));
		expect(result).toMatchObject({ ok: false });
		expect(result.ok === false && result.error).toMatch(/missing counter/i);
	});

	it('defaults a missing exportedAt rather than failing', () => {
		const { exportedAt: _dropped, ...rest } = valid;
		const result = parseBackup(serialise(rest));
		expect(result.ok && result.value.exportedAt).toBe(0);
	});
});
