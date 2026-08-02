import { describe, expect, it } from 'vitest';
import { isTheme, readStoredTheme, resolveTheme } from './theme';

describe('isTheme', () => {
	it('accepts the three known values', () => {
		expect([isTheme('light'), isTheme('dark'), isTheme('system')]).toEqual([true, true, true]);
	});

	it('rejects anything else', () => {
		expect([isTheme('midnight'), isTheme(''), isTheme(null), isTheme(1)]).toEqual([
			false,
			false,
			false,
			false
		]);
	});
});

describe('readStoredTheme', () => {
	it('returns a stored choice', () => {
		expect(readStoredTheme('dark')).toBe('dark');
	});

	it('falls back to system when nothing is stored', () => {
		expect(readStoredTheme(null)).toBe('system');
	});

	it('falls back to system for a value it does not recognise', () => {
		// A stale key from an older build must not leave the app themeless.
		expect(readStoredTheme('midnight')).toBe('system');
	});
});

describe('resolveTheme', () => {
	it('takes an explicit choice over the system preference', () => {
		expect([resolveTheme('light', true), resolveTheme('dark', false)]).toEqual(['light', 'dark']);
	});

	it('follows the system preference when set to system', () => {
		expect([resolveTheme('system', true), resolveTheme('system', false)]).toEqual([
			'dark',
			'light'
		]);
	});
});
