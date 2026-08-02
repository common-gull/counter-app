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
	class="card flex items-center justify-between gap-4 px-4 py-3.5 transition
		hover:border-gray-300 hover:shadow
		focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
>
	<span class="min-w-0 truncate font-medium">{counter.name}</span>

	<span class="flex shrink-0 items-baseline gap-1.5">
		<span class="text-xl font-semibold tabular-nums">{$total ?? '…'}</span>
		{#if counter.unit}<span class="text-sm text-gray-500">{counter.unit}</span>{/if}
		<span class="text-sm text-gray-400">today</span>
	</span>
</a>
