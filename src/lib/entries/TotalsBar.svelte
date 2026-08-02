<script lang="ts">
	import { liveQuery } from 'dexie';
	import { rangeFor } from '../time';
	import { totalBetween } from './queries';

	let {
		counterId,
		unit,
		now = new Date()
	}: { counterId: number; unit?: string; now?: Date } = $props();

	// One subscription for all three windows, so a write repaints them together.
	const totals = $derived(
		liveQuery(async () => ({
			day: await totalBetween(counterId, rangeFor('day', now)),
			week: await totalBetween(counterId, rangeFor('week', now)),
			month: await totalBetween(counterId, rangeFor('month', now))
		}))
	);

	const windows = [
		{ key: 'day', label: 'Today' },
		{ key: 'week', label: 'This week' },
		{ key: 'month', label: 'This month' }
	] as const;
</script>

<dl class="grid grid-cols-3 gap-2">
	{#each windows as window (window.key)}
		<div class="card px-2 py-3 text-center sm:px-3">
			<dt class="text-[11px] font-medium text-gray-500 uppercase sm:text-xs sm:tracking-wide">
				{window.label}
			</dt>
			<dd class="mt-1 truncate text-xl font-semibold tabular-nums sm:text-2xl">
				{$totals?.[window.key] ?? '…'}{#if unit}<span
						class="ml-1 text-xs font-normal text-gray-500">{unit}</span
					>{/if}
			</dd>
		</div>
	{/each}
</dl>
