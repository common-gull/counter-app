<script lang="ts">
	import { page } from '$app/state';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { initTheme } from '$lib/theme/theme.svelte';

	let { children } = $props();

	// Client-only: this app never renders on a server.
	initTheme();

	const onSettings = $derived(page.url.pathname.startsWith('/settings'));
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<!-- Background and text colour come from <html>; see layout.css. -->
<div class="min-h-screen">
	<header class="sticky top-0 z-10 border-b border-line bg-surface/90 backdrop-blur">
		<nav class="mx-auto flex max-w-2xl items-center justify-between gap-4 px-4 py-3">
			<a href="/" class="text-base font-semibold tracking-tight hover:opacity-70">Counter</a>
			<a
				href="/settings"
				aria-current={onSettings ? 'page' : undefined}
				class="rounded-lg px-2.5 py-1.5 text-sm transition
					{onSettings ? 'bg-surface-muted font-medium text-ink' : 'text-ink-muted hover:bg-surface-muted'}"
			>
				Settings
			</a>
		</nav>
	</header>

	<main class="mx-auto max-w-2xl px-4 py-8">
		{@render children()}
	</main>
</div>
