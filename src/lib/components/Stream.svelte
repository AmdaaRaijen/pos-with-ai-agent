<script lang="ts" generics="T">
	import { invalidateAll } from '$app/navigation';
	import type { Snippet } from 'svelte';

	/**
	 * Tampilkan data yang datang menyusul (promise dari load). Skeleton selama menunggu.
	 * Saat data dimuat ulang (setelah simpan), data lama tetap tampil sampai yang baru tiba.
	 * `key` berubah (misal ganti periode) = data lama dibuang dan skeleton tampil lagi.
	 */
	let { promise, key = '', skeleton, children }: { promise: Promise<T>; key?: string; skeleton: Snippet; children: Snippet<[T]> } = $props();

	let value = $state.raw<T | undefined>();
	let failed = $state(false);
	// svelte-ignore state_referenced_locally
	let lastKey = key;

	$effect(() => {
		const p = promise;
		if (key !== lastKey) {
			lastKey = key;
			value = undefined;
		}
		failed = false;
		p.then(
			(v) => {
				if (p === promise) value = v;
			},
			() => {
				if (p === promise) failed = true;
			}
		);
	});
</script>

{#if value !== undefined}
	{@render children(value as T)}
{:else if failed}
	<div class="rounded-3xl border border-zinc-200/70 bg-white p-6 text-center shadow-lift" role="alert">
		<p class="text-base font-semibold">Data gagal dimuat</p>
		<p class="mt-1 text-sm text-zinc-500">Cek sambungan internet, lalu coba lagi.</p>
		<button class="btn-soft mt-4" onclick={() => invalidateAll()}>Coba lagi</button>
	</div>
{:else}
	{@render skeleton()}
{/if}
