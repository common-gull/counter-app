<script lang="ts">
	import { logEntry } from './queries';
	import { validateAmount } from './validate';

	let { counterId, unit }: { counterId: number; unit?: string } = $props();

	let amount = $state('');
	let error = $state('');
	// Plain let, not $state: only ever read imperatively in the submit handler, so
	// making it reactive would buy nothing.
	let input: HTMLInputElement | undefined;

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
			class="field min-w-0 flex-1"
		/>
		<button type="submit" class="btn btn-primary shrink-0 px-6">Log</button>
	</div>
	{#if error}<p role="alert" class="error-text">{error}</p>{/if}
</form>
