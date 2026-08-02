<script lang="ts">
	import { liveQuery } from 'dexie';
	import { formatCount, formatDayHeading } from '../format';
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
	<p class="muted">Loading…</p>
{:else if groups.length === 0}
	<div class="card p-8 text-center">
		<p class="font-medium text-ink">Nothing logged yet</p>
		<p class="muted mt-1">Use the box above to log your first amount.</p>
	</div>
{:else}
	{#each groups as group (group.key)}
		<section class="mb-5">
			<h3
				class="mb-1.5 flex items-baseline justify-between gap-2 text-xs font-semibold
					tracking-wide text-ink-subtle uppercase"
			>
				<span>{formatDayHeading(group.timestamp, now)}</span>
				<span class="text-ink-muted normal-case tabular-nums">
					{formatCount(group.total)}{#if unit}&nbsp;{unit}{/if}
				</span>
			</h3>
			<ul class="card divide-y divide-line overflow-hidden">
				{#each group.entries as entry (entry.id)}
					<EntryRow {entry} {unit} />
				{/each}
			</ul>
		</section>
	{/each}

	{#if $entries !== undefined && $entries.length === HISTORY_LIMIT}
		<p class="muted">Showing the {HISTORY_LIMIT} most recent entries.</p>
	{/if}
{/if}
