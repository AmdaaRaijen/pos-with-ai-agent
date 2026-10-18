<script lang="ts">
	import { enhance } from '$app/forms';
	import { dayLabel, emoneyFee, rp, timeLabel, wibDate } from '#lib/money.ts';
	import { toast } from '#lib/toast.svelte.ts';
	import MoneyInput from '#lib/components/MoneyInput.svelte';
	import ArrowLeft from 'phosphor-svelte/lib/ArrowLeft';
	import Plus from 'phosphor-svelte/lib/Plus';
	import Minus from 'phosphor-svelte/lib/Minus';
	import Trash from 'phosphor-svelte/lib/Trash';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	type Line = { product_id: string; name: string; kind: string; qty: number; price: number; nominal: number };

	// Salinan yang bisa diubah dari data transaksi
	// svelte-ignore state_referenced_locally
	let lines = $state<Line[]>(
		data.sale.sale_items.map((i) => ({
			product_id: i.product_id ?? '',
			name: i.name,
			kind: i.kind,
			qty: i.qty,
			price: i.unit_price,
			nominal: i.nominal ?? 0
		}))
	);
	// svelte-ignore state_referenced_locally
	let note = $state(data.sale.note ?? '');
	let saving = $state(false);

	const payload = $derived(
		lines.map((l) => (l.kind === 'emoney' ? { product_id: l.product_id, qty: 1, nominal: l.nominal } : { product_id: l.product_id, qty: l.qty, unit_price: l.price }))
	);
	const total = $derived(
		lines.reduce((a, l) => a + (l.kind === 'emoney' ? emoneyFee(l.nominal, data.emoney).fee : l.price * l.qty), 0)
	);
	const when = $derived(wibDate(new Date(data.sale.created_at)));
</script>

<a href="/riwayat" class="press -ml-2 mb-4 inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-base font-medium text-zinc-600">
	<ArrowLeft size={20} weight="bold" /> Kembali
</a>

<header class="rise mb-6">
	<h1 class="text-2xl font-semibold tracking-tight">Ubah transaksi</h1>
	<p class="mt-1 text-sm text-zinc-500">{dayLabel(when)}, jam {timeLabel(data.sale.created_at)}</p>
</header>

<form
	method="POST"
	action="?/save"
	class="rise"
	style="--i:1"
	use:enhance={() => {
		saving = true;
		return async ({ result, update }) => {
			saving = false;
			if (result.type === 'success') {
				toast('Perubahan tersimpan');
				await update({ reset: false });
			} else if (result.type === 'failure') {
				toast(String(result.data?.error ?? 'Gagal menyimpan'), 'error');
			} else {
				toast('Gagal menyimpan. Cek sambungan internet.', 'error');
			}
		};
	}}
>
	<input type="hidden" name="lines" value={JSON.stringify(payload)} />

	<ul class="divide-y divide-zinc-100 rounded-3xl border border-zinc-200/70 bg-white px-4 shadow-lift">
		{#each lines as l, idx (idx)}
			<li class="py-4">
				<div class="flex items-center gap-3">
					<div class="min-w-0 flex-1">
						<p class="truncate text-base font-semibold">{l.name}</p>
						{#if l.kind === 'barang'}<p class="text-sm text-zinc-500">{rp(l.price)} per satuan</p>{/if}
					</div>
					{#if l.kind === 'barang'}
						<div class="flex items-center gap-1 rounded-2xl bg-zinc-100 p-1">
							<button type="button" class="press grid size-11 place-items-center rounded-xl bg-white" onclick={() => l.qty > 1 && l.qty--} aria-label="Kurangi"><Minus size={18} weight="bold" /></button>
							<span class="w-9 text-center text-base font-semibold">{l.qty}</span>
							<button type="button" class="press grid size-11 place-items-center rounded-xl bg-white" onclick={() => l.qty++} aria-label="Tambah"><Plus size={18} weight="bold" /></button>
						</div>
					{/if}
					{#if lines.length > 1}
						<button type="button" class="press grid size-11 place-items-center rounded-xl bg-rose-50 text-rose-700" onclick={() => lines.splice(idx, 1)} aria-label="Hapus {l.name}"><Trash size={20} /></button>
					{/if}
				</div>
				{#if l.kind === 'emoney'}
					<div class="mt-3">
						<label class="label" for="nom{idx}">Nominal saldo</label>
						<MoneyInput id="nom{idx}" bind:value={l.nominal} />
						<p class="mt-2 text-sm text-zinc-500">Biaya admin {rp(emoneyFee(l.nominal, data.emoney).fee)}</p>
					</div>
				{/if}
			</li>
		{/each}
	</ul>

	<div class="mt-5">
		<label class="label" for="note">Catatan</label>
		<input class="field" id="note" name="note" maxlength="200" bind:value={note} placeholder="Boleh kosong" />
	</div>

	<div class="mt-5 flex items-center justify-between rounded-3xl bg-zinc-100 px-5 py-4">
		<span class="text-base text-zinc-600">Total toko</span>
		<span class="text-xl font-bold">{rp(total)}</span>
	</div>

	<button class="btn-primary mt-5 w-full" disabled={saving || lines.some((l) => l.kind === 'emoney' && l.nominal <= 0)}>
		{saving ? 'Menyimpan...' : 'Simpan perubahan'}
	</button>
	<p class="mt-3 text-center text-sm text-zinc-500">Stok barang ikut dihitung ulang.</p>
</form>
