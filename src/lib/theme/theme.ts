/**
 * Theme preference. Pure so the rules are node-testable; the DOM and storage side
 * lives in `theme.svelte.ts`.
 *
 * The choice is kept in localStorage rather than IndexedDB: it has to be readable
 * synchronously before first paint to avoid a flash of the wrong theme, and it is
 * device chrome rather than user data, so it has no business in a backup file.
 */

export const THEME_STORAGE_KEY = 'counter-app-theme';

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEMES: Theme[] = ['light', 'dark', 'system'];

export function isTheme(value: unknown): value is Theme {
	return typeof value === 'string' && (THEMES as string[]).includes(value);
}

/** Anything unrecognised, including nothing stored at all, means "follow the system". */
export function readStoredTheme(raw: string | null): Theme {
	return isTheme(raw) ? raw : 'system';
}

export function resolveTheme(theme: Theme, prefersDark: boolean): ResolvedTheme {
	if (theme === 'system') return prefersDark ? 'dark' : 'light';
	return theme;
}
