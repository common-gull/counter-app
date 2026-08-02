<script lang="ts">
	import { liveQuery } from 'dexie';
	import { formatCount } from '../format';
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

<!--
	Stacked rows rather than three columns. Side by side, a large total has nowhere to
	go: it widens its column, breaks the grid and drags the page past the viewport.
	As rows, the label holds its width and the figure truncates within what is left.
-->
<dl class="card divide-y divide-gray-100">
	{#each windows as window (window.key)}
		<div class="flex items-baseline justify-between gap-4 px-4 py-3">
			<dt class="shrink-0 text-sm text-gray-600">{window.label}</dt>
			<dd class="flex min-w-0 items-baseline gap-1.5">
				<span class="truncate text-xl font-semibold tabular-nums">
					{$totals ? formatCount($totals[window.key]) : '…'}
				</span>
				{#if unit}<span class="shrink-0 text-sm text-gray-500">{unit}</span>{/if}
			</dd>
		</div>
	{/each}
</dl>
