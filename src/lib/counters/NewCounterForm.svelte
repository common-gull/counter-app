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

<form onsubmit={submit} class="flex flex-wrap items-start gap-2">
	<div class="min-w-48 flex-1">
		<input
			bind:value={name}
			aria-label="Counter name"
			placeholder="Cat treats"
			aria-invalid={error !== ''}
			class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-gray-500 focus:outline-none"
		/>
		{#if error}<p role="alert" class="mt-1 text-sm text-red-600">{error}</p>{/if}
	</div>
	<input
		bind:value={unit}
		aria-label="Unit (optional)"
		placeholder="treats"
		class="w-28 rounded-md border border-gray-300 px-3 py-2 focus:border-gray-500 focus:outline-none"
	/>
	<button
		type="submit"
		class="rounded-md bg-gray-900 px-4 py-2 font-medium text-white transition hover:bg-gray-700"
	>
		Add counter
	</button>
</form>
