import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearBody, click } from '../testing/dom';
import ThemeToggle from './ThemeToggle.svelte';
import { THEME_STORAGE_KEY } from './theme';
import { initTheme } from './theme.svelte';

let stopListening: (() => void) | undefined;

/** jsdom has no matchMedia; the system preference is a test input here. */
function stubSystemDark(prefersDark: boolean) {
	vi.stubGlobal('matchMedia', () => ({
		matches: prefersDark,
		addEventListener: () => {},
		removeEventListener: () => {}
	}));
}

beforeEach(() => {
	localStorage.clear();
	document.documentElement.classList.remove('dark');
});

afterEach(() => {
	stopListening?.();
	stopListening = undefined;
	vi.unstubAllGlobals();
	clearBody();
});

function render(prefersDark = false) {
	stubSystemDark(prefersDark);
	stopListening = initTheme();
	const component = mount(ThemeToggle, { target: document.body });
	flushSync();
	return component;
}

const isDark = () => document.documentElement.classList.contains('dark');
const options = () => [...document.body.querySelectorAll('[role="radio"]')];
const checked = () =>
	options()
		.filter((o) => o.getAttribute('aria-checked') === 'true')
		.map((o) => o.textContent?.trim());

describe('ThemeToggle', () => {
	it('offers light, dark and system', () => {
		const component = render();
		expect(options().map((o) => o.textContent?.trim())).toEqual(['Light', 'Dark', 'System']);
		unmount(component);
	});

	it('starts on system when nothing is stored', () => {
		const component = render();
		expect(checked()).toEqual(['System']);
		unmount(component);
	});

	it('reflects a stored choice', () => {
		localStorage.setItem(THEME_STORAGE_KEY, 'dark');
		const component = render();
		expect(checked()).toEqual(['Dark']);
		unmount(component);
	});

	it('marks exactly one option at a time', () => {
		const component = render();
		click('Dark');
		expect(checked()).toEqual(['Dark']);
		unmount(component);
	});

	it('darkens the page when dark is chosen', () => {
		const component = render();
		click('Dark');
		expect(isDark()).toBe(true);
		unmount(component);
	});

	it('lightens the page again when light is chosen', () => {
		const component = render(true);
		expect(isDark()).toBe(true);

		click('Light');

		expect(isDark()).toBe(false);
		unmount(component);
	});

	it('persists the choice', () => {
		const component = render();
		click('Dark');
		expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
		unmount(component);
	});

	it('follows a dark system preference when set to system', () => {
		const component = render(true);
		expect([checked(), isDark()]).toEqual([['System'], true]);
		unmount(component);
	});

	it('keeps light on a light system preference when set to system', () => {
		const component = render(false);
		expect(isDark()).toBe(false);
		unmount(component);
	});

	it('an explicit light choice survives a dark system preference', () => {
		localStorage.setItem(THEME_STORAGE_KEY, 'light');
		const component = render(true);
		expect(isDark()).toBe(false);
		unmount(component);
	});
});

describe('mobile browser chrome', () => {
	const themeColor = () =>
		document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.content;

	afterEach(() => {
		document.querySelector('meta[name="theme-color"]')?.remove();
		document.documentElement.style.removeProperty('--canvas');
	});

	it('matches the page canvas', () => {
		// jsdom loads no stylesheet, so stand the token up inline.
		document.documentElement.style.setProperty('--canvas', '#09090b');
		const component = render();
		click('Dark');
		expect(themeColor()).toBe('#09090b');
		unmount(component);
	});

	it('is left alone when the canvas colour cannot be resolved', () => {
		const component = render();
		click('Dark');
		expect(themeColor()).toBeUndefined();
		unmount(component);
	});
});
