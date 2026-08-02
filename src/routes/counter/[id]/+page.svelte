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
	<p class="muted">Loading…</p>
{:else if counter === undefined}
	<div class="card p-8 text-center">
		<h1 class="section-title">Counter not found</h1>
		<p class="muted mt-1">It may have been deleted.</p>
		<a href="/" class="btn btn-secondary mt-4">Back to all counters</a>
	</div>
{:else}
	<div class="mb-6">
		<a href="/" class="muted hover:text-gray-900">&larr; All counters</a>
		<h1 class="page-title mt-1 break-words">{counter.name}</h1>
	</div>

	<div class="mb-4">
		<LogForm counterId={counter.id} unit={counter.unit} />
	</div>

	<div class="mb-8">
		<TotalsBar counterId={counter.id} unit={counter.unit} />
	</div>

	<h2 class="section-title mb-3">History</h2>
	<EntryList counterId={counter.id} unit={counter.unit} />
{/if}
