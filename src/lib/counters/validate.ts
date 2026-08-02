import type { Validated } from '../validation';

export const MAX_NAME_LENGTH = 60;
export const MAX_UNIT_LENGTH = 16;

/** Trims, then rejects empty or overlong names. */
export function validateCounterName(raw: string): Validated<string> {
	const value = raw.trim();
	if (value === '') return { ok: false, error: 'Give the counter a name.' };
	if (value.length > MAX_NAME_LENGTH) {
		return { ok: false, error: `Keep the name to ${MAX_NAME_LENGTH} characters or fewer.` };
	}
	return { ok: true, value };
}

/**
 * The unit is optional, so an empty result is valid and means "no unit". It is capped
 * because it renders inline beside every total.
 */
export function validateUnit(raw: string): Validated<string> {
	const value = raw.trim();
	if (value.length > MAX_UNIT_LENGTH) {
		return { ok: false, error: `Keep the unit to ${MAX_UNIT_LENGTH} characters or fewer.` };
	}
	return { ok: true, value };
}
