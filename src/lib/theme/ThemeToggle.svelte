<script lang="ts">
	import { THEMES, type Theme } from './theme';
	import { setTheme, theme } from './theme.svelte';

	const labels: Record<Theme, string> = { light: 'Light', dark: 'Dark', system: 'System' };
</script>

<div
	role="radiogroup"
	aria-label="Theme"
	class="inline-flex gap-1 rounded-lg border border-line bg-surface p-1"
>
	{#each THEMES as option (option)}
		{@const selected = theme.preference === option}
		<button
			type="button"
			role="radio"
			aria-checked={selected}
			onclick={() => setTheme(option)}
			class="btn btn-sm {selected ? 'bg-accent text-accent-ink' : 'btn-ghost'}"
		>
			{labels[option]}
		</button>
	{/each}
</div>
