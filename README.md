# counter-app

Track counts of things. Add a section — "Cat treats" — log how many, and see totals
for the day, week and month.

Everything is stored locally in the browser with IndexedDB. There is no server and no
account; the app builds to static files.

## Running it

Requires [Bun](https://bun.sh).

```sh
bun install
bun run dev      # development server
bun run test     # unit and component tests
bun run check    # type checking
bun run build    # static build into build/
```

## Stack

SvelteKit 2 with Svelte 5 runes, Tailwind 4, [Dexie](https://dexie.org) over IndexedDB,
Vitest. Built with `adapter-static` in SPA mode, so any static host will serve it.

Conventions and architecture notes are in [CLAUDE.md](CLAUDE.md).
