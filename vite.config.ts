import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';

// GitHub Pages serves a project site from /<repo>, so CI builds with BASE_PATH set.
// Empty locally, which keeps `bun run dev` at /. Anything not starting with a slash is
// ignored rather than silently producing broken asset URLs.
const fromEnv = process.env.BASE_PATH ?? '';
const base: '' | `/${string}` = fromEnv.startsWith('/') ? (fromEnv as `/${string}`) : '';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) => filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			// SPA mode: /counter/[id] ids only exist at runtime, and IndexedDB is
			// browser-only, so serve a single shell and route on the client.
			adapter: adapter({ fallback: 'index.html' }),
			paths: { base },
			// Routes live in the hash, so GitHub Pages never sees them and deep links
			// need no 404.html trick. Internal links must be written as plain "#/..."
			// so they stay same-document; see CLAUDE.md.
			router: { type: 'hash' }
		})
	],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				// Components render into jsdom — no browser engine, no Playwright download.
				// The `browser` condition is required, otherwise Svelte resolves to its
				// server build and `mount` has no DOM to write into.
				// https://svelte.dev/docs/svelte/testing
				resolve: { conditions: ['browser'] },
				test: {
					name: 'client',
					environment: 'jsdom',
					// Pinned for the same reason as the server project: components render
					// local times, so without this they pass locally and fail on a CI
					// runner in UTC.
					env: { TZ: 'America/New_York' },
					// jsdom has no IndexedDB; components reach the repository through it.
					setupFiles: ['fake-indexeddb/auto'],
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**']
				}
			},

			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					// Dexie runs against an in-memory IndexedDB; no browser involved.
					setupFiles: ['fake-indexeddb/auto'],
					// Pinned so local-time/DST assertions don't depend on the machine clock.
					env: { TZ: 'America/New_York' },
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
