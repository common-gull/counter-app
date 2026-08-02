<script lang="ts">
	import ExportButton from '$lib/backup/ExportButton.svelte';
	import ImportForm from '$lib/backup/ImportForm.svelte';
	import ThemeToggle from '$lib/theme/ThemeToggle.svelte';
</script>

<svelte:head><title>Settings</title></svelte:head>

<h1 class="page-title mb-6">Settings</h1>

<section class="card mb-4 p-5">
	<h2 class="section-title">Appearance</h2>
	<p class="muted mt-1 mb-4">System follows your device setting.</p>
	<ThemeToggle />
</section>

<section class="card mb-4 p-5">
	<h2 class="section-title">Backup</h2>
	<p class="muted mt-1 mb-4">
		Everything is stored only in this browser. Clearing site data, or switching to another
		device, loses it. A backup file is the only way to get it back.
	</p>
	<ExportButton />
</section>

<section class="card p-5">
	<h2 class="section-title">Restore</h2>
	<p class="muted mt-1 mb-4">
		Load a backup file. This replaces everything currently stored, rather than merging.
	</p>
	<ImportForm />
</section>
