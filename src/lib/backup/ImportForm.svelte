<script lang="ts">
	import { importAll } from './backup';
	import type { Backup } from './types';
	import { parseBackup } from './validate';

	let input = $state<HTMLInputElement>();
	// raw, not deep-proxied: IndexedDB cannot structured-clone a Proxy, so handing a
	// plain `$state` object to importAll fails at write time.
	let pending = $state.raw<Backup | undefined>(undefined);
	let filename = $state('');
	let error = $state('');
	let done = $state('');

	/** Drop the chosen file so picking the same one again re-fires `change`. */
	function clearSelection() {
		pending = undefined;
		filename = '';
		if (input) input.value = '';
	}

	function reset() {
		clearSelection();
		error = '';
		done = '';
	}

	async function chooseFile() {
		pending = undefined;
		error = '';
		done = '';

		const file = input?.files?.[0];
		if (!file) return;
		filename = file.name;

		// Validated in full before anything is written — import replaces everything,
		// so a file that fails halfway through would destroy the existing data.
		const result = parseBackup(await file.text());
		if (!result.ok) {
			error = result.error;
			return;
		}
		pending = result.value;
	}

	async function confirmImport() {
		if (!pending) return;
		const { counters, entries } = pending;
		try {
			await importAll(pending);
		} catch {
			error = 'Could not restore that backup.';
			return;
		}
		// Not reset(), which would wipe the message we are about to show.
		clearSelection();
		error = '';
		done = `Restored ${counters.length} counters and ${entries.length} entries.`;
	}
</script>

<div class="flex flex-wrap items-center gap-3">
	<!--
		The input is nested inside the label rather than linked by id: clicking the
		label opens the picker either way, and nesting lets `focus-within` give the
		visually hidden input a visible focus ring.
	-->
	<label
		class="btn btn-secondary focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-gray-900"
	>
		<input
			bind:this={input}
			onchange={chooseFile}
			type="file"
			accept="application/json,.json"
			aria-label="Backup file"
			class="sr-only"
		/>
		Choose backup file…
	</label>
	{#if filename}
		<span class="muted truncate">{filename}</span>
	{/if}
</div>

{#if error}<p role="alert" class="mt-3 text-sm text-red-600">{error}</p>{/if}
{#if done}
	<p role="status" class="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
		{done}
	</p>
{/if}

{#if pending}
	<div class="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4">
		<p class="text-sm font-medium text-amber-900">This replaces everything currently stored.</p>
		<p class="mt-1 text-sm text-amber-800">
			Restore {pending.counters.length} counters and {pending.entries.length} entries?
		</p>
		<div class="mt-3 flex flex-wrap gap-2">
			<button type="button" onclick={confirmImport} class="btn btn-danger btn-sm">
				Replace my data
			</button>
			<button type="button" onclick={reset} class="btn btn-ghost btn-sm">Cancel</button>
		</div>
	</div>
{/if}
