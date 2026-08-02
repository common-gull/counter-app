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
			<dt
				class="truncate text-[10px] font-medium tracking-wide text-gray-500 uppercase sm:text-xs"
			>
				{window.label}
			</dt>
			<!-- Number and unit stack: on one baseline the unit crowds the figure, and
				 the three tiles stop lining up once the figures differ in width. -->
			<dd class="mt-2">
				<span class="block text-2xl leading-none font-semibold tabular-nums">
					{$totals?.[window.key] ?? '…'}
				</span>
				{#if unit}
					<span class="mt-1.5 block truncate text-[11px] text-gray-500">{unit}</span>
				{/if}
			</dd>
		</div>
	{/each}
</dl>
