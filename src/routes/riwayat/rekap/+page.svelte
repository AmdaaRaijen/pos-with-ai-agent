<script lang="ts">
	import Stream from '#lib/components/Stream.svelte';
	import Skel from '#lib/components/Skel.svelte';
	import Rekap from './Rekap.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<Stream promise={data.main}>
	{#snippet skeleton()}
		<div class="mb-6"><h1 class="text-2xl font-semibold tracking-tight">Rekap transaksi</h1></div>
		<div class="space-y-3">
			{#each Array(3) as _, i (i)}<Skel class="h-24 !rounded-3xl" />{/each}
		</div>
	{/snippet}
	{#snippet children(d)}
		<Rekap data={d} />
	{/snippet}
</Stream>
