<script lang="ts">
	import '../app.css';
	import favicon from '#lib/assets/favicon.svg';
	import BottomNav from '#lib/components/BottomNav.svelte';
	import Toaster from '#lib/components/Toaster.svelte';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	{#await data.storeName}
		<title>Kasir</title>
	{:then name}
		<title>{name} - Kasir</title>
	{:catch}
		<title>Kasir</title>
	{/await}
</svelte:head>

<Toaster />
<div class="mx-auto min-h-[100dvh] w-full max-w-xl px-4 pt-6 {data.loggedIn ? 'pb-28' : 'pb-8'}">
	{@render children()}
</div>
{#if data.loggedIn}<BottomNav />{/if}
