import type { Validated } from '../validation';

/**
 * Amounts may be fractional — a counter with a "cups" unit can legitimately log 1.5 —
 * but must be a positive, finite number.
 */
export function validateAmount(raw: string): Validated<number> {
	const trimmed = raw.trim();
	if (trimmed === '') return { ok: false, error: 'Enter an amount.' };

	const value = Number(trimmed);
	if (!Number.isFinite(value)) return { ok: false, error: 'Enter a number.' };
	if (value <= 0) return { ok: false, error: 'Enter an amount greater than zero.' };

	return { ok: true, value };
}
