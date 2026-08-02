<script lang="ts">
	import { exportAll } from './backup';
	import { backupFilename, saveJsonFile } from './download';

	let error = $state('');

	async function download() {
		error = '';
		try {
			const backup = await exportAll();
			saveJsonFile(JSON.stringify(backup, null, 2), backupFilename(backup.exportedAt));
		} catch {
			error = 'Could not create the backup file.';
		}
	}
</script>

<button type="button" onclick={download} class="btn btn-primary btn-block">Download backup</button>
{#if error}<p role="alert" class="error-text">{error}</p>{/if}
