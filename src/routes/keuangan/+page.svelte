<script lang="ts">
	import Stream from '#lib/components/Stream.svelte';
	import Skel from '#lib/components/Skel.svelte';
	import Keuangan from './Keuangan.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<Stream promise={data.main} key={data.key}>
	{#snippet skeleton()}
		<div class="mb-5"><h1 class="text-2xl font-semibold tracking-tight">Keuangan</h1></div>
		<Skel class="mb-5 h-12" />
		<Skel class="mb-4 h-36 !rounded-3xl" />
		<Skel class="mb-4 h-52 !rounded-3xl" />
		<div class="space-y-3">
			{#each Array(3) as _, i (i)}<Skel class="h-16 !rounded-3xl" />{/each}
		</div>
	{/snippet}
	{#snippet children(d)}
		<Keuangan data={d} />
	{/snippet}
</Stream>
