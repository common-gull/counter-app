<script lang="ts">
	import { resolve } from '$app/paths';
	import { liveQuery } from 'dexie';
	import { totalBetween } from '../entries/queries';
	import { formatCount } from '../format';
	import { rangeFor } from '../time';
	import type { Counter } from './types';

	let { counter, now = new Date() }: { counter: Counter; now?: Date } = $props();

	// `now` is a prop so tests can pin the day without touching the clock.
	const today = $derived(rangeFor('day', now));
	const total = $derived(liveQuery(() => totalBetween(counter.id, today)));
</script>

<a
	href={resolve('/counter/[id]', { id: String(counter.id) })}
	class="card flex items-center justify-between gap-4 px-4 py-3.5 transition
		hover:border-line-strong hover:shadow
		focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
>
	<span class="min-w-0 truncate font-medium">{counter.name}</span>

	<span class="flex min-w-0 max-w-[55%] items-baseline gap-1.5">
		<span class="truncate text-xl font-semibold tabular-nums">
			{$total === undefined ? '…' : formatCount($total)}
		</span>
		{#if counter.unit}<span class="shrink-0 text-sm text-ink-subtle">{counter.unit}</span>{/if}
		<span class="shrink-0 text-sm text-ink-faint">today</span>
	</span>
</a>
