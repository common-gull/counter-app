<script lang="ts">
	import CounterList from '$lib/counters/CounterList.svelte';
	import NewCounterForm from '$lib/counters/NewCounterForm.svelte';
</script>

<svelte:head><title>Counters</title></svelte:head>

<h1 class="page-title mb-6">Counters</h1>

<div class="mb-6">
	<NewCounterForm />
</div>

<CounterList />
