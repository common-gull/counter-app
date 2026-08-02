<script lang="ts">
	import { liveQuery } from 'dexie';
	import CounterCard from './CounterCard.svelte';
	import { listCounters } from './queries';

	let { now = new Date() }: { now?: Date } = $props();

	const counters = $derived(liveQuery(() => listCounters()));
</script>

{#if $counters === undefined}
	<p class="muted">Loading…</p>
{:else if $counters.length === 0}
	<div class="card p-8 text-center">
		<p class="font-medium text-ink">No counters yet</p>
		<p class="muted mt-1">Add one above to start tracking.</p>
	</div>
{:else}
	<ul class="flex flex-col gap-2">
		{#each $counters as counter (counter.id)}
			<li><CounterCard {counter} {now} /></li>
		{/each}
	</ul>
{/if}
