<script lang="ts">
	import { liveQuery } from 'dexie';
	import { formatDayHeading } from '../format';
	import EntryRow from './EntryRow.svelte';
	import { groupByDay } from './group';
	import { HISTORY_LIMIT, listEntries } from './queries';

	let {
		counterId,
		unit,
		now = new Date()
	}: { counterId: number; unit?: string; now?: Date } = $props();

	const entries = $derived(liveQuery(() => listEntries(counterId, HISTORY_LIMIT)));
	const groups = $derived($entries === undefined ? undefined : groupByDay($entries));
</script>

{#if groups === undefined}
	<p class="text-gray-500">Loading…</p>
{:else if groups.length === 0}
	<p class="text-gray-500">Nothing logged yet.</p>
{:else}
	{#each groups as group (group.key)}
		<section class="mb-4">
			<h3 class="mb-1 text-sm font-medium text-gray-500">
				{formatDayHeading(group.timestamp, now)}
			</h3>
			<ul class="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200 bg-white">
				{#each group.entries as entry (entry.id)}
					<EntryRow {entry} {unit} />
				{/each}
			</ul>
		</section>
	{/each}

	{#if $entries !== undefined && $entries.length === HISTORY_LIMIT}
		<p class="text-sm text-gray-500">Showing the {HISTORY_LIMIT} most recent entries.</p>
	{/if}
{/if}
