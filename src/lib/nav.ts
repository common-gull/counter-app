import { base, resolve } from '$app/paths';
import type { PathnameWithSearchOrHash, RouteIdWithSearchOrHash } from '$app/types';

/**
 * A same-document href for the hash router.
 *
 * `resolve()` returns `<base>#<route>`, whose pathname is the base with no trailing
 * slash. GitHub Pages serves the app at `<base>/`, and in hash mode SvelteKit treats a
 * link whose pathname differs from the current one as external:
 *
 *     if (hash_routing) return url.pathname !== location.pathname;
 *
 * so `/counter-app#/settings` clicked from `/counter-app/` triggers a full page load
 * and a 301 straight back. Dropping the base leaves a hash-only link, which resolves
 * against whatever the current pathname is and is therefore always same-document.
 *
 * Use this for every internal link and `goto`. Assets still need the base, which they
 * get from `paths.base` — this only affects routes.
 */
export function hashHref<T extends RouteIdWithSearchOrHash | PathnameWithSearchOrHash>(
	// SvelteKit does not export ResolveArgs, so borrow it off `resolve` itself. That
	// keeps route ids and their params type-checked at every call site.
	...args: Parameters<typeof resolve<T>>
): string {
	return stripBase(resolve<T>(...args), base);
}

/**
 * Split out so the behaviour can be tested against a real base. Tests build with an
 * empty base, where `resolve()` and `hashHref()` happen to agree — which is exactly
 * why the deployed bug went unnoticed.
 */
export function stripBase(resolved: string, basePath: string): string {
	return resolved.slice(basePath.length);
}
