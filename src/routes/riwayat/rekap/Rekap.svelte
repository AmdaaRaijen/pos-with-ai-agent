<script lang="ts">
	import { enhance } from '$app/forms';
	import { emoneyFee, rp, wibDate } from '#lib/money.ts';
	import { label, type Product } from '#lib/types.ts';
	import { toast } from '#lib/toast.svelte.ts';
	import Sheet from '#lib/components/Sheet.svelte';
	import MoneyInput from '#lib/components/MoneyInput.svelte';
	import ArrowLeft from 'phosphor-svelte/lib/ArrowLeft';
	import Plus from 'phosphor-svelte/lib/Plus';
	import Minus from 'phosphor-svelte/lib/Minus';
	import Trash from 'phosphor-svelte/lib/Trash';
	import type { inventory } from '#lib/server/pages.ts';

	let { data }: { data: Awaited<ReturnType<typeof inventory>> } = $props();

	type Line = { product_id: string; name: string; kind: string; qty: number; price: number; nominal: number; paid: number };

	const today = wibDate();
	let date = $state(today);
	let note = $state('');
	let lines = $state<Line[]>([]);
	let addOpen = $state(false);
	let saving = $state(false);

	function addProduct(p: Product) {
		const cur = p.kind === 'barang' ? lines.find((l) => l.product_id === p.id) : undefined;
		if (cur) cur.qty++;
		else lines.push({ product_id: p.id, name: label(p), kind: p.kind, qty: 1, price: p.sell_price, nominal: 0, paid: 0 });
		addOpen = false;
	}

	const payload = $derived(
		lines.map((l) => (l.kind === 'emoney' ? { product_id: l.product_id, qty: 1, nominal: l.nominal, paid: l.paid } : { product_id: l.product_id, qty: l.qty }))
	);
	const total = $derived(lines.reduce((a, l) => a + (l.kind === 'emoney' ? l.paid - l.nominal : l.price * l.qty), 0));
	const valid = $derived(lines.length > 0 && !!date && date <= today && lines.every((l) => l.kind !== 'emoney' || (l.nominal > 0 && l.paid >= l.nominal)));
</script>

<a href="/riwayat" class="press -ml-2 mb-4 inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-base font-medium text-zinc-600">
	<ArrowLeft size={20} weight="bold" /> Kembali
</a>

<header class="rise mb-6">
	<h1 class="text-2xl font-semibold tracking-tight">Rekap transaksi</h1>
	<p class="mt-1 text-sm text-zinc-500">Untuk mencatat penjualan yang sudah lewat. Stok barang tidak berubah.</p>
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
			if (result.type === 'failure') toast(String(result.data?.error ?? 'Gagal menyimpan'), 'error');
			else if (result.type === 'error') toast('Gagal menyimpan. Cek sambungan internet.', 'error');
			else toast('Rekap tersimpan');
			await update();
		};
	}}
>
	<input type="hidden" name="lines" value={JSON.stringify(payload)} />

	<div>
		<label class="label" for="date">Tanggal transaksi</label>
		<input class="field" id="date" name="date" type="date" max={today} bind:value={date} required />
	</div>

	{#if lines.length > 0}
		<ul class="mt-5 divide-y divide-zinc-100 rounded-3xl border border-zinc-200/70 bg-white px-4 shadow-lift">
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
						<button type="button" class="press grid size-11 place-items-center rounded-xl bg-rose-50 text-rose-700" onclick={() => lines.splice(idx, 1)} aria-label="Hapus {l.name}"><Trash size={20} /></button>
					</div>
					{#if l.kind === 'emoney'}
						<div class="mt-3">
							<label class="label" for="nom{idx}">Nominal saldo</label>
							<MoneyInput id="nom{idx}" bind:value={l.nominal} />
							<label class="label mt-3" for="paid{idx}">Pembeli bayar</label>
							<MoneyInput id="paid{idx}" bind:value={l.paid} />
							<p class="mt-2 text-sm text-zinc-500">Untung {rp(emoneyFee(l.nominal, l.paid, data.emoney).profit)} (admin {rp(data.emoney.admin)})</p>
						</div>
					{/if}
				</li>
			{/each}
		</ul>

		<div class="mt-5 flex items-center justify-between rounded-3xl bg-zinc-100 px-5 py-4">
			<span class="text-base text-zinc-600">Total toko</span>
			<span class="text-xl font-bold">{rp(total)}</span>
		</div>
	{/if}

	<button type="button" class="btn-soft mt-5 w-full" onclick={() => (addOpen = true)}><Plus size={20} weight="bold" /> Tambah barang atau saldo</button>

	<div class="mt-5">
		<label class="label" for="note">Catatan</label>
		<input class="field" id="note" name="note" maxlength="200" bind:value={note} placeholder="Boleh kosong" />
	</div>

	<button class="btn-primary mt-5 w-full" disabled={!valid || saving}>{saving ? 'Menyimpan...' : 'Simpan rekap'}</button>
</form>

<Sheet bind:open={addOpen} title="Tambah ke rekap">
	<ul class="divide-y divide-zinc-100">
		{#each data.products as p (p.id)}
			<li>
				<button type="button" class="press flex min-h-16 w-full items-center justify-between gap-3 py-3 text-left" onclick={() => addProduct(p)}>
					<span class="min-w-0">
						<span class="block truncate text-base font-semibold">{label(p)}</span>
						<span class="block text-sm text-zinc-500">{p.kind === 'emoney' ? 'Saldo e-money' : p.sell_price === 0 ? 'Pendukung' : rp(p.sell_price)}</span>
					</span>
					<Plus size={20} weight="bold" class="shrink-0 text-emerald-700" />
				</button>
			</li>
		{/each}
	</ul>
</Sheet>
