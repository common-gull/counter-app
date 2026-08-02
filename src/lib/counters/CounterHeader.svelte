<script lang="ts">
	import { hashHref } from '../nav';
	import { liveQuery } from 'dexie';
	import { countEntries } from '../entries/queries';
	import { deleteCounter, updateCounter } from './queries';
	import type { Counter } from './types';
	import { validateCounterFields } from './validate';

	// `ondeleted` rather than navigating here, so the component stays testable
	// without a router.
	let { counter, ondeleted }: { counter: Counter; ondeleted?: () => void } = $props();

	type Mode = 'view' | 'editing' | 'confirming-delete';
	let mode = $state<Mode>('view');
	let name = $state('');
	let unit = $state('');
	let error = $state('');

	const entryCount = $derived(liveQuery(() => countEntries(counter.id)));

	function startEditing() {
		name = counter.name;
		unit = counter.unit ?? '';
		error = '';
		mode = 'editing';
	}

	function cancel() {
		error = '';
		mode = 'view';
	}

	async function save(event: SubmitEvent) {
		event.preventDefault();

		const checked = validateCounterFields(name, unit);
		if (!checked.ok) {
			error = checked.error;
			return;
		}

		// An empty unit is meaningful here: it clears one that was set before.
		await updateCounter(counter.id, checked.value);
		mode = 'view';
		error = '';
	}

	async function confirmDelete() {
		await deleteCounter(counter.id);
		ondeleted?.();
	}
</script>

<div class="mb-6">
	<a href={hashHref('/')} class="muted hover:text-ink">&larr; All counters</a>

	{#if mode === 'editing'}
		<form onsubmit={save} class="mt-2 flex flex-col gap-2">
			<div class="flex flex-col gap-2 sm:flex-row sm:items-start">
				<input
					bind:value={name}
					aria-label="Counter name"
					aria-invalid={error !== ''}
					class="field sm:flex-1"
				/>
				<input
					bind:value={unit}
					aria-label="Unit (optional)"
					placeholder="treats"
					class="field sm:w-28 sm:shrink-0"
				/>
			</div>
			<div class="flex gap-2">
				<button type="submit" class="btn btn-primary btn-grow">Save</button>
				<button type="button" onclick={cancel} class="btn btn-secondary btn-grow">
					Cancel
				</button>
			</div>
			{#if error}<p role="alert" class="error-text">{error}</p>{/if}
		</form>
	{:else}
		<div class="mt-1 flex flex-wrap items-center justify-between gap-3">
			<h1 class="page-title break-words">{counter.name}</h1>
			<span class="flex shrink-0 gap-1">
				<button type="button" onclick={startEditing} class="btn btn-ghost btn-sm">Edit</button>
				<button
					type="button"
					onclick={() => (mode = 'confirming-delete')}
					class="btn btn-ghost btn-sm">Delete</button
				>
			</span>
		</div>
	{/if}

	{#if mode === 'confirming-delete'}
		<div
			class="mt-3 rounded-lg border border-red-300 bg-red-50 p-4
				dark:border-red-500/40 dark:bg-red-500/10"
		>
			<p class="text-sm font-medium text-red-900 dark:text-red-200">Delete "{counter.name}"?</p>
			<p class="mt-1 text-sm text-red-800 dark:text-red-300">
				{#if $entryCount === undefined}
					Checking what will be removed…
				{:else}
					{$entryCount === 0
						? 'It has no entries.'
						: `Its ${$entryCount} ${$entryCount === 1 ? 'entry goes' : 'entries go'} with it.`}
					This cannot be undone.
				{/if}
			</p>
			<div class="mt-3 flex gap-2">
				<button type="button" onclick={confirmDelete} class="btn btn-danger btn-sm btn-grow">
					Delete counter
				</button>
				<button type="button" onclick={cancel} class="btn btn-secondary btn-sm btn-grow">Cancel</button>
			</div>
		</div>
	{/if}
</div>
