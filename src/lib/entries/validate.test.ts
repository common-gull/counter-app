import { describe, expect, it } from 'vitest';
import { validateAmount } from './validate';

describe('validateAmount', () => {
	it('accepts a whole number', () => {
		expect(validateAmount('3')).toEqual({ ok: true, value: 3 });
	});

	it('accepts a fractional amount', () => {
		expect(validateAmount('1.5')).toEqual({ ok: true, value: 1.5 });
	});

	it('trims surrounding whitespace', () => {
		expect(validateAmount('  2  ')).toEqual({ ok: true, value: 2 });
	});

	it('rejects an empty string', () => {
		expect(validateAmount('')).toMatchObject({ ok: false });
	});

	it('rejects whitespace only', () => {
		expect(validateAmount('   ')).toMatchObject({ ok: false });
	});

	it('rejects text', () => {
		expect(validateAmount('lots')).toMatchObject({ ok: false });
	});

	it('rejects zero', () => {
		expect(validateAmount('0')).toMatchObject({ ok: false });
	});

	it('rejects a negative amount', () => {
		expect(validateAmount('-2')).toMatchObject({ ok: false });
	});

	it('rejects Infinity', () => {
		expect(validateAmount('Infinity')).toMatchObject({ ok: false });
	});

	it('rejects NaN spelled out', () => {
		expect(validateAmount('NaN')).toMatchObject({ ok: false });
	});
});
