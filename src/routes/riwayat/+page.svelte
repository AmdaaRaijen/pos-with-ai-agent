<script lang="ts">
	import Stream from '#lib/components/Stream.svelte';
	import Skel from '#lib/components/Skel.svelte';
	import TransaksiTabs from '#lib/components/TransaksiTabs.svelte';
	import Riwayat from './Riwayat.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<Stream promise={data.main}>
	{#snippet skeleton()}
		<div class="mb-5"><h1 class="text-2xl font-semibold tracking-tight">Transaksi</h1></div>
		<div class="mb-5"><TransaksiTabs active="riwayat" /></div>
		<div class="space-y-3">
			{#each Array(6) as _, i (i)}<Skel class="h-16 !rounded-3xl" />{/each}
		</div>
	{/snippet}
	{#snippet children(d)}
		<Riwayat data={d} />
	{/snippet}
</Stream>
