<script lang="ts">
	import { page } from '$app/state';
	import { liveQuery } from 'dexie';
	import { getCounter } from '$lib/counters/queries';
	import EntryList from '$lib/entries/EntryList.svelte';
	import LogForm from '$lib/entries/LogForm.svelte';
	import TotalsBar from '$lib/entries/TotalsBar.svelte';

	const counterId = $derived(Number(page.params.id));

	// Wrapped in an object so "still loading" (undefined) is distinguishable from
	// "no such counter" (a resolved result whose counter is undefined).
	const found = $derived(
		liveQuery(async () => ({
			counter: Number.isInteger(counterId) ? await getCounter(counterId) : undefined
		}))
	);
	const counter = $derived($found?.counter);
</script>

<svelte:head><title>{counter?.name ?? 'Counter'}</title></svelte:head>

{#if $found === undefined}
	<p class="text-gray-500">Loading…</p>
{:else if counter === undefined}
	<h1 class="mb-2 text-2xl font-semibold text-gray-900">Counter not found</h1>
	<p class="text-gray-500">
		It may have been deleted. <a href="/" class="underline">Back to all counters</a>.
	</p>
{:else}
	<div class="mb-4 flex items-baseline justify-between gap-4">
		<h1 class="text-2xl font-semibold text-gray-900">{counter.name}</h1>
		<a href="/" class="text-sm text-gray-600 hover:text-gray-900">All counters</a>
	</div>

	<div class="mb-4">
		<LogForm counterId={counter.id} unit={counter.unit} />
	</div>

	<div class="mb-6">
		<TotalsBar counterId={counter.id} unit={counter.unit} />
	</div>

	<h2 class="mb-2 text-lg font-medium text-gray-900">History</h2>
	<EntryList counterId={counter.id} unit={counter.unit} />
{/if}
