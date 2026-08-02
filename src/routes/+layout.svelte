<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="min-h-screen bg-gray-50">
	<header class="border-b border-gray-200 bg-white">
		<nav class="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
			<a href="/" class="font-semibold text-gray-900">Counter</a>
			<a href="/settings" class="text-sm text-gray-600 hover:text-gray-900">Settings</a>
		</nav>
	</header>
	<main class="mx-auto max-w-2xl px-4 py-6">
		{@render children()}
	</main>
</div>
