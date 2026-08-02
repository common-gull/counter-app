<script lang="ts">
	import { liveQuery } from 'dexie';
	import CounterCard from './CounterCard.svelte';
	import { listCounters } from './queries';

	let { now = new Date() }: { now?: Date } = $props();

	const counters = $derived(liveQuery(() => listCounters()));
</script>

{#if $counters === undefined}
	<p class="text-gray-500">Loading…</p>
{:else if $counters.length === 0}
	<p class="text-gray-500">No counters yet. Add one above to start tracking.</p>
{:else}
	<ul class="flex flex-col gap-2">
		{#each $counters as counter (counter.id)}
			<li><CounterCard {counter} {now} /></li>
		{/each}
	</ul>
{/if}
