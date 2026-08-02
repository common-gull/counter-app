<script lang="ts">
	import { formatCount, formatTimeOfDay, fromDateTimeLocal, toDateTimeLocal } from '../format';
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
		<!--
			Stacked below `sm`: a datetime-local input has a wide intrinsic minimum and
			will not share a row with the amount and both buttons on a phone.
		-->
		<form onsubmit={save} class="flex flex-col gap-2">
			<div class="flex gap-2">
				<input
					bind:value={amount}
					aria-label="Amount"
					inputmode="decimal"
					class="field {error !== '' ? 'field-invalid' : ''} w-20 shrink-0 py-1.5"
				/>
				<input
					bind:value={when}
					type="datetime-local"
					aria-label="Date and time"
					class="field min-w-0 flex-1 py-1.5"
				/>
			</div>
			<div class="flex gap-2">
				<button type="submit" class="btn btn-primary btn-sm flex-1 sm:flex-none">Save</button>
				<button type="button" onclick={cancel} class="btn btn-secondary btn-sm flex-1 sm:flex-none">
					Cancel
				</button>
			</div>
			{#if error}<p role="alert" class="text-sm text-red-600">{error}</p>{/if}
		</form>
	{:else if mode === 'confirming-delete'}
		<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
			<span class="text-sm font-medium text-gray-900">Delete this entry?</span>
			<span class="flex gap-2">
				<button type="button" onclick={confirmDelete} class="btn btn-danger btn-sm flex-1 sm:flex-none">
					Delete
				</button>
				<button type="button" onclick={cancel} class="btn btn-secondary btn-sm flex-1 sm:flex-none">
					Keep
				</button>
			</span>
		</div>
	{:else}
		<div class="flex items-center justify-between gap-2">
			<span class="flex min-w-0 items-baseline gap-3">
				<span class="shrink-0 text-sm tabular-nums text-gray-500">
					{formatTimeOfDay(entry.timestamp)}
				</span>
				<span class="min-w-0 truncate font-medium tabular-nums">
					{formatCount(entry.amount)}{#if unit}<span
							class="ml-1 text-sm font-normal text-gray-500">{unit}</span
						>{/if}
				</span>
			</span>

			<!-- Kept at partial opacity rather than hidden: touch has no hover. -->
			<span class="flex shrink-0 gap-0.5 opacity-70 transition group-hover:opacity-100">
				<button type="button" onclick={startEditing} class="btn btn-ghost btn-sm px-2">Edit</button>
				<button
					type="button"
					onclick={() => (mode = 'confirming-delete')}
					class="btn btn-ghost btn-sm px-2">Delete</button
				>
			</span>
		</div>
	{/if}
</li>
