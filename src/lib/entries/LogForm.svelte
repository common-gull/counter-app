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

<form onsubmit={submit} class="card p-4">
	<div class="flex items-start gap-2">
		<input
			bind:this={input}
			bind:value={amount}
			aria-label="Amount"
			inputmode="decimal"
			placeholder={unit ? `How many ${unit}?` : 'How many?'}
			aria-invalid={error !== ''}
			class="field {error !== '' ? 'field-invalid' : ''} flex-1"
		/>
		<button type="submit" class="btn btn-primary shrink-0">Log</button>
	</div>
	{#if error}<p role="alert" class="mt-2 text-sm text-red-600">{error}</p>{/if}
</form>
