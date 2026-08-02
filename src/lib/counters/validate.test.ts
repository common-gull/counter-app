import { describe, expect, it } from 'vitest';
import { MAX_NAME_LENGTH, validateCounterName } from './validate';

describe('validateCounterName', () => {
	it('accepts an ordinary name', () => {
		expect(validateCounterName('Cat treats')).toEqual({ ok: true, value: 'Cat treats' });
	});

	it('trims surrounding whitespace', () => {
		expect(validateCounterName('  Cat treats  ')).toEqual({ ok: true, value: 'Cat treats' });
	});

	it('rejects an empty name', () => {
		expect(validateCounterName('')).toMatchObject({ ok: false });
	});

	it('rejects a whitespace-only name', () => {
		expect(validateCounterName('   ')).toMatchObject({ ok: false });
	});

	it('accepts a name at the length limit', () => {
		expect(validateCounterName('a'.repeat(MAX_NAME_LENGTH))).toMatchObject({ ok: true });
	});

	it('rejects a name past the length limit', () => {
		expect(validateCounterName('a'.repeat(MAX_NAME_LENGTH + 1))).toMatchObject({ ok: false });
	});

	it('measures length after trimming', () => {
		const padded = `  ${'a'.repeat(MAX_NAME_LENGTH)}  `;
		expect(validateCounterName(padded)).toMatchObject({ ok: true });
	});
});
