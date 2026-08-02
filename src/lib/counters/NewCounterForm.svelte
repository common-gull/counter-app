<script lang="ts">
	import { addCounter } from './queries';
	import { validateCounterFields } from './validate';

	let name = $state('');
	let unit = $state('');
	let error = $state('');

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		const checked = validateCounterFields(name, unit);
		if (!checked.ok) {
			error = checked.error;
			return;
		}
		await addCounter(checked.value);
		name = '';
		unit = '';
		error = '';
	}
</script>

<form onsubmit={submit} class="card p-4">
	<div class="flex flex-col gap-2 sm:flex-row sm:items-start">
		<input
			bind:value={name}
			aria-label="Counter name"
			placeholder="Cat treats"
			aria-invalid={error !== ''}
			class="field sm:flex-1"
		/>
		<input
			bind:value={unit}
			aria-label="Unit (optional)"
			placeholder="treats"
			class="field sm:w-28 sm:shrink-0"
		/>
		<button type="submit" class="btn btn-primary btn-block sm:shrink-0">Add counter</button>
	</div>
	{#if error}<p role="alert" class="error-text">{error}</p>{/if}
</form>
