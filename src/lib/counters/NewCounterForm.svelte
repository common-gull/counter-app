<script lang="ts">
	import { addCounter } from './queries';
	import { validateCounterName } from './validate';

	let name = $state('');
	let unit = $state('');
	let error = $state('');

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		const checked = validateCounterName(name);
		if (!checked.ok) {
			error = checked.error;
			return;
		}
		const trimmedUnit = unit.trim();
		await addCounter({ name: checked.value, ...(trimmedUnit === '' ? {} : { unit: trimmedUnit }) });
		name = '';
		unit = '';
		error = '';
	}
</script>

<form onsubmit={submit} class="card p-4">
	<div class="flex flex-wrap items-start gap-2">
		<input
			bind:value={name}
			aria-label="Counter name"
			placeholder="Cat treats"
			aria-invalid={error !== ''}
			class="field {error !== '' ? 'field-invalid' : ''} min-w-48 flex-1"
		/>
		<input
			bind:value={unit}
			aria-label="Unit (optional)"
			placeholder="treats"
			class="field w-28 shrink-0"
		/>
		<button type="submit" class="btn btn-primary shrink-0">Add counter</button>
	</div>
	{#if error}<p role="alert" class="mt-2 text-sm text-red-600">{error}</p>{/if}
</form>
