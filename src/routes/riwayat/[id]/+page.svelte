<script lang="ts">
	import Stream from '#lib/components/Stream.svelte';
	import Skel from '#lib/components/Skel.svelte';
	import Detail from './Detail.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<Stream promise={data.main}>
	{#snippet skeleton()}
		<div class="mb-6"><Skel class="h-8 w-48" /></div>
		<div class="space-y-3">
			{#each Array(3) as _, i (i)}<Skel class="h-24 !rounded-3xl" />{/each}
		</div>
	{/snippet}
	{#snippet children(d)}
		{#if d}
			<Detail data={d} />
		{:else}
			<div class="rounded-3xl border border-dashed border-zinc-300 px-6 py-12 text-center">
				<h2 class="text-lg font-semibold">Transaksi tidak ditemukan</h2>
				<a href="/riwayat" class="btn-primary mt-6">Kembali</a>
			</div>
		{/if}
	{/snippet}
</Stream>
