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
		<div class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-center">
			<dt class="text-xs text-gray-500">{window.label}</dt>
			<dd class="text-xl font-semibold tabular-nums text-gray-900">
				{$totals?.[window.key] ?? '—'}
				{#if unit}<span class="text-xs font-normal text-gray-500">{unit}</span>{/if}
			</dd>
		</div>
	{/each}
</dl>
