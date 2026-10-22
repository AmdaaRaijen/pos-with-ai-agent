<script lang="ts">
	import Stream from '#lib/components/Stream.svelte';
	import Skel from '#lib/components/Skel.svelte';
	import Inventory from './Inventory.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<Stream promise={data.main}>
	{#snippet skeleton()}
		<div class="mb-5"><h1 class="text-2xl font-semibold tracking-tight">Stok</h1></div>
		<Skel class="mb-4 h-13" />
		<div class="space-y-3">
			{#each Array(6) as _, i (i)}<Skel class="h-20 !rounded-3xl" />{/each}
		</div>
	{/snippet}
	{#snippet children(d)}
		<Inventory data={d} />
	{/snippet}
</Stream>
