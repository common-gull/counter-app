import { describe, expect, it } from 'vitest';
import { stripBase } from './nav';

// A link keeping the base — "/counter-app#/settings" — has pathname "/counter-app",
// while GitHub Pages serves the app at "/counter-app/". In hash mode SvelteKit treats
// a differing pathname as external, so the browser did a full page load and a 301
// back on every click. These pin the fix against a real base, which the component
// tests cannot do because they build with an empty one.
describe('stripBase', () => {
	it('drops a project-site base, leaving a hash-only link', () => {
		expect(stripBase('/counter-app#/settings', '/counter-app')).toBe('#/settings');
	});

	it('drops the base from a route with params', () => {
		expect(stripBase('/counter-app#/counter/7', '/counter-app')).toBe('#/counter/7');
	});

	it('handles the app root', () => {
		expect(stripBase('/counter-app#/', '/counter-app')).toBe('#/');
	});

	it('is a no-op when there is no base', () => {
		expect(stripBase('#/settings', '')).toBe('#/settings');
	});

	it('always yields a link with no pathname of its own', () => {
		const cases = [
			stripBase('/counter-app#/', '/counter-app'),
			stripBase('/counter-app#/settings', '/counter-app'),
			stripBase('#/counter/1', '')
		];
		expect(cases.every((href) => href.startsWith('#'))).toBe(true);
	});
});
