import {
	readStoredTheme,
	resolveTheme,
	THEME_STORAGE_KEY,
	type ResolvedTheme,
	type Theme
} from './theme';

/**
 * Applies the theme imperatively rather than through an `$effect`. Writing the class
 * onto <html> is a one-way sync to something outside Svelte's ownership, and doing it
 * in the setter keeps the whole flow visible at the call site.
 */

const DARK_QUERY = '(prefers-color-scheme: dark)';

let preference = $state<Theme>('system');
let prefersDark = $state(false);

export const theme = {
	/** What the user chose, which may be 'system'. */
	get preference(): Theme {
		return preference;
	},
	/** What that resolves to right now. */
	get resolved(): ResolvedTheme {
		return resolveTheme(preference, prefersDark);
	}
};

/**
 * Keeps the mobile browser chrome in step with the page. Reads the resolved value of
 * `--canvas` rather than repeating the palette, so it cannot drift from layout.css.
 */
function syncThemeColor(): void {
	const canvas = getComputedStyle(document.documentElement).getPropertyValue('--canvas').trim();
	if (canvas === '') return;

	let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
	if (!meta) {
		meta = document.createElement('meta');
		meta.name = 'theme-color';
		document.head.append(meta);
	}
	meta.content = canvas;
}

function apply(): void {
	const dark = resolveTheme(preference, prefersDark) === 'dark';
	document.documentElement.classList.toggle('dark', dark);
	syncThemeColor();
}

/**
 * Call once, from the root layout. The inline script in app.html has already applied
 * the class by this point; this picks the state back up so the UI can reflect it and
 * keeps it in step when the system preference changes.
 */
export function initTheme(): () => void {
	preference = readStoredTheme(localStorage.getItem(THEME_STORAGE_KEY));

	const query = window.matchMedia(DARK_QUERY);
	prefersDark = query.matches;

	const onChange = (event: MediaQueryListEvent) => {
		prefersDark = event.matches;
		apply();
	};
	query.addEventListener('change', onChange);

	apply();
	return () => query.removeEventListener('change', onChange);
}

export function setTheme(next: Theme): void {
	preference = next;
	localStorage.setItem(THEME_STORAGE_KEY, next);
	apply();
}
