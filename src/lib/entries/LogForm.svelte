<script lang="ts">
	import { logEntry } from './queries';
	import { validateAmount } from './validate';

	let { counterId, unit }: { counterId: number; unit?: string } = $props();

	let amount = $state('');
	let error = $state('');
	let input = $state<HTMLInputElement>();

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		const checked = validateAmount(amount);
		if (!checked.ok) {
			error = checked.error;
			return;
		}
		await logEntry(counterId, checked.value);
		amount = '';
		error = '';
		// Logging is repetitive; keep the caret where the next amount goes.
		input?.focus();
	}
</script>

<form onsubmit={submit}>
	<div class="flex items-start gap-2">
		<div class="flex-1">
			<input
				bind:this={input}
				bind:value={amount}
				aria-label="Amount"
				inputmode="decimal"
				placeholder={unit ? `How many ${unit}?` : 'How many?'}
				aria-invalid={error !== ''}
				class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-gray-500 focus:outline-none"
			/>
		</div>
		<button
			type="submit"
			class="rounded-md bg-gray-900 px-4 py-2 font-medium text-white transition hover:bg-gray-700"
		>
			Log
		</button>
	</div>
	{#if error}<p role="alert" class="mt-1 text-sm text-red-600">{error}</p>{/if}
</form>
