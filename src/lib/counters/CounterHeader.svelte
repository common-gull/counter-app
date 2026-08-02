<script lang="ts">
	import { liveQuery } from 'dexie';
	import { countEntries } from '../entries/queries';
	import { deleteCounter, updateCounter } from './queries';
	import type { Counter } from './types';
	import { validateCounterName, validateUnit } from './validate';

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

		const checkedName = validateCounterName(name);
		if (!checkedName.ok) {
			error = checkedName.error;
			return;
		}
		const checkedUnit = validateUnit(unit);
		if (!checkedUnit.ok) {
			error = checkedUnit.error;
			return;
		}

		// An empty unit is meaningful here: it clears one that was set before.
		await updateCounter(counter.id, { name: checkedName.value, unit: checkedUnit.value });
		mode = 'view';
		error = '';
	}

	async function confirmDelete() {
		await deleteCounter(counter.id);
		ondeleted?.();
	}
</script>

<div class="mb-6">
	<a href="/" class="muted hover:text-gray-900">&larr; All counters</a>

	{#if mode === 'editing'}
		<form onsubmit={save} class="mt-2 flex flex-wrap items-start gap-2">
			<input
				bind:value={name}
				aria-label="Counter name"
				aria-invalid={error !== ''}
				class="field {error !== '' ? 'field-invalid' : ''} min-w-48 flex-1"
			/>
			<input
				bind:value={unit}
				aria-label="Unit (optional)"
				placeholder="treats"
				class="field w-28 shrink-0"
			/>
			<button type="submit" class="btn btn-primary">Save</button>
			<button type="button" onclick={cancel} class="btn btn-ghost">Cancel</button>
			{#if error}<p role="alert" class="w-full text-sm text-red-600">{error}</p>{/if}
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
		<div class="mt-3 rounded-lg border border-red-300 bg-red-50 p-4">
			<p class="text-sm font-medium text-red-900">Delete "{counter.name}"?</p>
			<p class="mt-1 text-sm text-red-800">
				{#if $entryCount === undefined}
					Checking what will be removed…
				{:else if $entryCount === 0}
					It has no entries. This cannot be undone.
				{:else if $entryCount === 1}
					Its 1 entry goes with it. This cannot be undone.
				{:else}
					Its {$entryCount} entries go with it. This cannot be undone.
				{/if}
			</p>
			<div class="mt-3 flex flex-wrap gap-2">
				<button type="button" onclick={confirmDelete} class="btn btn-danger btn-sm">
					Delete counter
				</button>
				<button type="button" onclick={cancel} class="btn btn-ghost btn-sm">Cancel</button>
			</div>
		</div>
	{/if}
</div>
