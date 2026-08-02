import { fromDateTimeLocal } from '../format';
import type { Validated } from '../validation';

/**
 * The rule itself, separate from parsing, so the import path can apply it to a number
 * it already has rather than re-deriving what counts as a valid amount.
 */
export function isValidAmount(value: number): boolean {
	return Number.isFinite(value) && value > 0;
}

/**
 * Amounts may be fractional — a counter with a "cups" unit can legitimately log 1.5 —
 * but must be a positive, finite number.
 */
export function validateAmount(raw: string): Validated<number> {
	const trimmed = raw.trim();
	if (trimmed === '') return { ok: false, error: 'Enter an amount.' };

	const value = Number(trimmed);
	if (!Number.isFinite(value)) return { ok: false, error: 'Enter a number.' };
	if (!isValidAmount(value)) return { ok: false, error: 'Enter an amount greater than zero.' };

	return { ok: true, value };
}

/**
 * A `datetime-local` value, as UTC epoch ms. The rule and its wording live here rather
 * than in the row component, so they are node-testable and the next form that edits a
 * timestamp gets the same behaviour.
 */
export function validateTimestamp(raw: string): Validated<number> {
	const value = fromDateTimeLocal(raw);
	if (value === null) return { ok: false, error: 'Enter a valid date and time.' };
	return { ok: true, value };
}
