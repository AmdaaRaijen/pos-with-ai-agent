<script lang="ts">
	import Stream from '#lib/components/Stream.svelte';
	import Skel from '#lib/components/Skel.svelte';
	import TransaksiTabs from '#lib/components/TransaksiTabs.svelte';
	import Transaksi from './Transaksi.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<Stream promise={data.main}>
	{#snippet skeleton()}
		<div class="mb-5"><h1 class="text-2xl font-semibold tracking-tight">Transaksi</h1></div>
		<div class="mb-5"><TransaksiTabs active="baru" /></div>
		<Skel class="mb-4 h-13" />
		<div class="grid grid-cols-2 gap-3">
			<Skel class="col-span-2 h-24 !rounded-3xl" />
			{#each Array(6) as _, i (i)}<Skel class="h-28 !rounded-3xl" />{/each}
		</div>
	{/snippet}
	{#snippet children(d)}
		<Transaksi data={d} />
	{/snippet}
</Stream>
