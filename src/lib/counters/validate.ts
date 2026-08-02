import type { Validated } from '../validation';

export const MAX_NAME_LENGTH = 60;

/** Trims, then rejects empty or overlong names. */
export function validateCounterName(raw: string): Validated<string> {
	const value = raw.trim();
	if (value === '') return { ok: false, error: 'Give the counter a name.' };
	if (value.length > MAX_NAME_LENGTH) {
		return { ok: false, error: `Keep the name to ${MAX_NAME_LENGTH} characters or fewer.` };
	}
	return { ok: true, value };
}
