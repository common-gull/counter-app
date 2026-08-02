<script lang="ts">
	import { addCounter } from './queries';
	import { validateCounterName, validateUnit } from './validate';

	let name = $state('');
	let unit = $state('');
	let error = $state('');

	async function submit(event: SubmitEvent) {
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
		await addCounter({
			name: checkedName.value,
			...(checkedUnit.value === '' ? {} : { unit: checkedUnit.value })
		});
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
			class="field {error !== '' ? 'field-invalid' : ''} w-full sm:flex-1"
		/>
		<input
			bind:value={unit}
			aria-label="Unit (optional)"
			placeholder="treats"
			class="field w-full sm:w-28 sm:shrink-0"
		/>
		<button type="submit" class="btn btn-primary btn-block sm:shrink-0">Add counter</button>
	</div>
	{#if error}<p role="alert" class="mt-2 text-sm text-red-600">{error}</p>{/if}
</form>
