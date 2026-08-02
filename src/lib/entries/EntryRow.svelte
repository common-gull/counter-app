<script lang="ts">
	import { formatTimeOfDay, fromDateTimeLocal, toDateTimeLocal } from '../format';
	import { deleteEntry, updateEntry } from './queries';
	import type { Entry } from './types';
	import { validateAmount } from './validate';

	let { entry, unit }: { entry: Entry; unit?: string } = $props();

	type Mode = 'view' | 'edit' | 'confirming-delete';
	let mode = $state<Mode>('view');
	let amount = $state('');
	let when = $state('');
	let error = $state('');

	function startEditing() {
		amount = String(entry.amount);
		when = toDateTimeLocal(entry.timestamp);
		error = '';
		mode = 'edit';
	}

	function cancel() {
		error = '';
		mode = 'view';
	}

	async function save(event: SubmitEvent) {
		event.preventDefault();

		const checkedAmount = validateAmount(amount);
		if (!checkedAmount.ok) {
			error = checkedAmount.error;
			return;
		}
		const timestamp = fromDateTimeLocal(when);
		if (timestamp === null) {
			error = 'Enter a valid date and time.';
			return;
		}

		await updateEntry(entry.id, { amount: checkedAmount.value, timestamp });
		mode = 'view';
		error = '';
	}

	async function confirmDelete() {
		await deleteEntry(entry.id);
	}
</script>

<li class="group px-4 py-2.5">
	{#if mode === 'edit'}
		<form onsubmit={save} class="flex flex-wrap items-center gap-2">
			<input
				bind:value={amount}
				aria-label="Amount"
				inputmode="decimal"
				class="field {error !== '' ? 'field-invalid' : ''} w-24 py-1"
			/>
			<input
				bind:value={when}
				type="datetime-local"
				aria-label="Date and time"
				class="field w-auto flex-1 py-1"
			/>
			<button type="submit" class="btn btn-primary btn-sm">Save</button>
			<button type="button" onclick={cancel} class="btn btn-ghost btn-sm">Cancel</button>
			{#if error}<p role="alert" class="w-full text-sm text-red-600">{error}</p>{/if}
		</form>
	{:else if mode === 'confirming-delete'}
		<div class="flex flex-wrap items-center justify-between gap-2">
			<span class="text-sm font-medium text-gray-900">Delete this entry?</span>
			<span class="flex gap-2">
				<button type="button" onclick={confirmDelete} class="btn btn-danger btn-sm">Delete</button>
				<button type="button" onclick={cancel} class="btn btn-ghost btn-sm">Keep</button>
			</span>
		</div>
	{:else}
		<div class="flex items-center justify-between gap-3">
			<span class="text-sm tabular-nums text-gray-500">{formatTimeOfDay(entry.timestamp)}</span>

			<span class="flex items-center gap-3">
				<span class="font-medium tabular-nums">
					{entry.amount}{#if unit}<span class="ml-1 text-sm font-normal text-gray-500">{unit}</span
						>{/if}
				</span>
				<!-- Kept discoverable on touch, where hover never happens. -->
				<span class="flex gap-1 opacity-60 transition group-hover:opacity-100">
					<button type="button" onclick={startEditing} class="btn btn-ghost btn-sm">Edit</button>
					<button
						type="button"
						onclick={() => (mode = 'confirming-delete')}
						class="btn btn-ghost btn-sm">Delete</button
					>
				</span>
			</span>
		</div>
	{/if}
</li>
