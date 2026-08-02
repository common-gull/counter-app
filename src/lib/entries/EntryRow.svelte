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

<li class="px-4 py-2">
	{#if mode === 'edit'}
		<form onsubmit={save} class="flex flex-wrap items-center gap-2">
			<input
				bind:value={amount}
				aria-label="Amount"
				inputmode="decimal"
				class="w-24 rounded-md border border-gray-300 px-2 py-1 focus:border-gray-500 focus:outline-none"
			/>
			<input
				bind:value={when}
				type="datetime-local"
				aria-label="Date and time"
				class="rounded-md border border-gray-300 px-2 py-1 focus:border-gray-500 focus:outline-none"
			/>
			<button type="submit" class="rounded-md bg-gray-900 px-3 py-1 text-sm text-white">
				Save
			</button>
			<button type="button" onclick={cancel} class="px-2 py-1 text-sm text-gray-600">
				Cancel
			</button>
			{#if error}<p role="alert" class="w-full text-sm text-red-600">{error}</p>{/if}
		</form>
	{:else if mode === 'confirming-delete'}
		<div class="flex flex-wrap items-center justify-between gap-2">
			<span class="text-sm text-gray-700">Delete this entry?</span>
			<span class="flex gap-2">
				<button
					type="button"
					onclick={confirmDelete}
					class="rounded-md bg-red-600 px-3 py-1 text-sm text-white">Delete</button
				>
				<button type="button" onclick={cancel} class="px-2 py-1 text-sm text-gray-600">
					Keep
				</button>
			</span>
		</div>
	{:else}
		<div class="flex items-center justify-between gap-2">
			<span class="text-sm text-gray-500">{formatTimeOfDay(entry.timestamp)}</span>
			<span class="flex items-center gap-3">
				<span class="font-medium tabular-nums text-gray-900">
					{entry.amount}{#if unit}<span class="ml-1 text-sm font-normal text-gray-500">{unit}</span
						>{/if}
				</span>
				<button type="button" onclick={startEditing} class="text-sm text-gray-600 hover:underline">
					Edit
				</button>
				<button
					type="button"
					onclick={() => (mode = 'confirming-delete')}
					class="text-sm text-gray-600 hover:underline">Delete</button
				>
			</span>
		</div>
	{/if}
</li>
