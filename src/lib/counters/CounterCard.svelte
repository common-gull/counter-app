<script lang="ts">
	import { liveQuery } from 'dexie';
	import { totalBetween } from '../entries/queries';
	import { rangeFor } from '../time';
	import type { Counter } from './types';

	let { counter, now = new Date() }: { counter: Counter; now?: Date } = $props();

	// `now` is a prop so tests can pin the day without touching the clock.
	const today = $derived(rangeFor('day', now));
	const total = $derived(liveQuery(() => totalBetween(counter.id, today)));
</script>

<a
	href="/counter/{counter.id}"
	class="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3 transition hover:border-gray-300 hover:bg-gray-50"
>
	<span class="font-medium text-gray-900">{counter.name}</span>
	<span class="text-right text-sm text-gray-500">
		<span class="text-lg font-semibold tabular-nums text-gray-900">{$total ?? '—'}</span>
		{#if counter.unit}<span class="ml-1">{counter.unit}</span>{/if}
		<span class="ml-1">today</span>
	</span>
</a>
