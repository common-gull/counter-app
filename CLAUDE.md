# counter-app

Local-first count tracker. Add a section ("Cat treats"), log amounts, see day/week/month
totals. Data lives in the browser via IndexedDB. 

## Commands

Use **Bun**, not npm or pnpm.

| | |
|---|---|
| `bun run dev` | dev server |
| `bun run test` | both vitest projects |
| `bun run check` | svelte-check |
| `bun run build` | static build into `build/` |

## Commits

[Conventional Commits](https://www.conventionalcommits.org): `type(scope): summary`.

- Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `build`.
- Scope is the domain (`counters`, `entries`, `backup`) or a cross-cutting area
  (`ui`, `build`, `deps`). Omit it if the change is genuinely global.
- Summary is imperative, lower case, no trailing full stop.
- `style:` means formatting only (whitespace, semicolons). A visual redesign is
  `feat(ui)`, not `style`.
- Keep commits atomic and ordered: a shared-class change and the feature that uses it
  are two commits, the shared change first.

## Config

- **No `svelte.config.js`.** Compiler options and the adapter are inline in
  `vite.config.ts`, in the `sveltekit({ ... })` call.
- **Static SPA on GitHub Pages**: `adapter-static` with `fallback: 'index.html'` and
  `router.type: 'hash'`. Nothing may assume a server at runtime — no `+page.server.ts`,
  no form actions, and no `ssr`/`prerender` page options (hash routing already implies
  both, and SvelteKit errors if you set them).
- **Build internal links with `resolve()`** from `$app/paths`, never a bare `href="/…"`.
  It prefixes both the base path and the `#`; a hardcoded path silently breaks on Pages.
- **`BASE_PATH`** sets `paths.base` at build time (CI passes `/<repo>`); unset locally so
  dev stays at `/`. `static/.nojekyll` is required, or Pages' Jekyll drops `_app/`.
- **Runes forced on** outside `node_modules`. Use `$state`/`$derived`/`$props`, never
  `export let` or `$:`.

## Architecture

**Organised by domain, not by layer.** A domain owns its types, queries, tests and
components.

```
src/lib/
  db.ts                shared: Dexie instance + schema for all tables
  time.ts              shared: local-time bucketing
  counters/            types.ts, queries.ts, components
  entries/             types.ts, queries.ts, components   (includes totals)
  backup/              types.ts, backup.ts                (export/import)
  testing/             test-only helpers
```

- **Only `db.ts` constructs Dexie.** Domain code imports `db`; components import that
  domain's `queries.ts`, never `db` directly.
- **Reactivity is `liveQuery`, no wrapper.** It already satisfies the Svelte store
  contract, so use `$derived(liveQuery(() => someQuery()))` and read it with `$`. There
  is no custom rune bridge — don't reintroduce one; `fromStore` covers the rest.
- **Timestamps are UTC epoch ms.** Local day/week/month bucketing happens at display
  time in `src/lib/time.ts`. Never persist a local date string.
- **Build date boundaries on `Date` component setters** (`setHours(0,0,0,0)`), never on
  epoch arithmetic — a local day is 23 or 25 hours across DST.
- **Ranges are half-open**: `from` inclusive, `to` exclusive.
- **Pass time in, don't mock the clock.** Time functions take a `Date`; writes that
  record a moment take an optional `at`.
- **Keep logic out of components** — validation and formatting go in plain modules so
  they're node-testable.

## Runes

Following the [Svelte best practices](https://svelte.dev/docs/svelte/best-practices):

- `$state` only for values read reactively. A `bind:this` ref used only inside event
  handlers is a plain `let`.
- `$state.raw` for objects replaced rather than mutated. For anything handed to
  IndexedDB this is required, not merely faster: a deep `$state` proxy cannot be
  structured-cloned, and the write fails at runtime.
- Compute with `$derived`, never `$effect`. There are currently zero effects in this
  codebase; adding one needs a reason.
- Key every `{#each}` by a stable id, never the array index.

## Testing

Filename suffix picks the environment:

| pattern | environment | for |
|---|---|---|
| `*.test.ts` | node, no DOM | logic, time, queries |
| `*.svelte.test.ts` | jsdom | components, anything using runes |

- **Component tests use jsdom, not a browser engine.** Don't reinstall Playwright or
  `vitest-browser-svelte`. Mount with `mount`/`unmount` from `svelte`, `flushSync()`
  after interactions, `$effect.root` for effects outside a component.
  `resolve.conditions: ['browser']` on the client project is required — without it
  Svelte resolves to its server build. https://svelte.dev/docs/svelte/testing
- **`TZ` is pinned to `America/New_York` on *both* projects.** Don't remove it: tests
  assert on local times, so without it they pass on your machine and fail on a CI
  runner in UTC. A guard test in each project (`time.test.ts`,
  `testing/timezone.svelte.test.ts`) fails first and says so.
- **`expect: { requireAssertions: true }`** — a test with no assertion fails.
- **`fake-indexeddb/auto` is in `setupFiles` for both projects**, so tests hit a real
  Dexie against an in-memory IndexedDB — compound-index queries included. There are no
  mocks of the data layer; `beforeEach(resetDatabase)` from `$lib/testing/reset-db`
  gives isolation.
- **Query tests `await` directly.** Test `queries.ts` functions, not `liveQuery`
  observables — that keeps tests free of emission polling.

When adding a test for behaviour that matters, break the implementation once and
confirm that test — and only that test — fails.
