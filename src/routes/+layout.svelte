<script lang="ts">
	import { page } from '$app/state';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();

	const onSettings = $derived(page.url.pathname.startsWith('/settings'));
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="min-h-screen bg-gray-50 text-gray-900">
	<header class="sticky top-0 z-10 border-b border-gray-200 bg-white/90 backdrop-blur">
		<nav class="mx-auto flex max-w-2xl items-center justify-between gap-4 px-4 py-3">
			<a href="/" class="text-base font-semibold tracking-tight hover:opacity-70">Counter</a>
			<a
				href="/settings"
				aria-current={onSettings ? 'page' : undefined}
				class="rounded-lg px-2.5 py-1.5 text-sm transition
					{onSettings ? 'bg-gray-100 font-medium text-gray-900' : 'text-gray-600 hover:bg-gray-100'}"
			>
				Settings
			</a>
		</nav>
	</header>

	<main class="mx-auto max-w-2xl px-4 py-8">
		{@render children()}
	</main>
</div>
