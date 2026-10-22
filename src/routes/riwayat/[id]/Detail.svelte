<script lang="ts">
	import { enhance } from '$app/forms';
	import { dayLabel, emoneyFee, rp, timeLabel, wibDate } from '#lib/money.ts';
	import { label, type Product } from '#lib/types.ts';
	import Sheet from '#lib/components/Sheet.svelte';
	import Warning from 'phosphor-svelte/lib/Warning';
	import { toast } from '#lib/toast.svelte.ts';
	import MoneyInput from '#lib/components/MoneyInput.svelte';
	import ArrowLeft from 'phosphor-svelte/lib/ArrowLeft';
	import Plus from 'phosphor-svelte/lib/Plus';
	import Minus from 'phosphor-svelte/lib/Minus';
	import Trash from 'phosphor-svelte/lib/Trash';
	import type { sale } from '#lib/server/pages.ts';

	let { data }: { data: NonNullable<Awaited<ReturnType<typeof sale>>> } = $props();

	type Line = { product_id: string; name: string; kind: string; qty: number; price: number; nominal: number; paid: number };

	// Salinan yang bisa diubah dari data transaksi
	// svelte-ignore state_referenced_locally
	let lines = $state<Line[]>(
		data.sale.sale_items.map((i) => ({
			product_id: i.product_id ?? '',
			name: i.name,
			kind: i.kind,
			qty: i.qty,
			price: i.unit_price,
			nominal: i.nominal ?? 0,
			paid: (i.nominal ?? 0) + i.unit_price
		}))
	);
	// svelte-ignore state_referenced_locally
	let note = $state(data.sale.note ?? '');
	let saving = $state(false);
	let confirmSave = $state(false);
	let confirmDelete = $state(false);
	let deleting = $state(false);
	let addOpen = $state(false);

	function addProduct(p: Product) {
		const cur = p.kind === 'barang' ? lines.find((l) => l.product_id === p.id) : undefined;
		if (cur) cur.qty++;
		else lines.push({ product_id: p.id, name: label(p), kind: p.kind, qty: 1, price: p.sell_price, nominal: 0, paid: 0 });
		addOpen = false;
		confirmSave = false;
	}

	const payload = $derived(
		lines.map((l) => (l.kind === 'emoney' ? { product_id: l.product_id, qty: 1, nominal: l.nominal, paid: l.paid } : { product_id: l.product_id, qty: l.qty, unit_price: l.price }))
	);
	const total = $derived(
		lines.reduce((a, l) => a + (l.kind === 'emoney' ? l.paid - l.nominal : l.price * l.qty), 0)
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
			confirmSave = false;
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
						<label class="label mt-3" for="paid{idx}">Pembeli bayar</label>
						<MoneyInput id="paid{idx}" bind:value={l.paid} />
						<p class="mt-2 text-sm text-zinc-500">Untung {rp(emoneyFee(l.nominal, l.paid, data.emoney).profit)} (admin {rp(data.emoney.admin)})</p>
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

	<button type="button" class="btn-soft mt-5 w-full" onclick={() => (addOpen = true)}><Plus size={20} weight="bold" /> Tambah barang ke transaksi ini</button>

	{#if confirmSave}
		<div class="mt-5 rounded-3xl bg-amber-50 p-4 text-amber-900" role="alert">
			<p class="flex items-center gap-2 text-base font-semibold"><Warning size={20} weight="bold" /> Simpan perubahan?</p>
			<p class="mt-1 text-sm">{data.sale.stock_applied ? 'Isi transaksi diganti, stok barang dihitung ulang, dan laporan keuangan ikut berubah.' : 'Ini rekap: isi transaksi diganti dan laporan keuangan ikut berubah, stok barang tidak berubah.'}</p>
			<div class="mt-4 grid grid-cols-2 gap-3">
				<button type="button" class="btn-soft" onclick={() => (confirmSave = false)}>Periksa lagi</button>
				<button class="btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Ya, simpan'}</button>
			</div>
		</div>
	{:else}
		<button type="button" class="btn-primary mt-3 w-full" disabled={lines.some((l) => l.kind === 'emoney' && (l.nominal <= 0 || l.paid < l.nominal))} onclick={() => (confirmSave = true)}>Simpan perubahan</button>
	{/if}
</form>

<!-- Hapus transaksi -->
<form
	method="POST"
	action="?/remove"
	class="mt-8"
	use:enhance={() => {
		deleting = true;
		return async ({ result, update }) => {
			deleting = false;
			if (result.type === 'failure') toast(String(result.data?.error ?? 'Gagal menghapus'), 'error');
			else if (result.type === 'error') toast('Gagal menghapus. Cek sambungan internet.', 'error');
			else toast('Transaksi dihapus');
			await update();
		};
	}}
>
	{#if confirmDelete}
		<div class="rounded-3xl bg-rose-50 p-4 text-rose-900" role="alert">
			<p class="flex items-center gap-2 text-base font-semibold"><Warning size={20} weight="bold" /> Hapus transaksi ini?</p>
			<p class="mt-1 text-sm">Transaksi hilang dari laporan dan stok barangnya dikembalikan. Ini tidak bisa dibatalkan.</p>
			<div class="mt-4 grid grid-cols-2 gap-3">
				<button type="button" class="btn-soft" onclick={() => (confirmDelete = false)}>Batal</button>
				<button class="btn-danger !bg-rose-700 !text-white" disabled={deleting}>{deleting ? 'Menghapus...' : 'Ya, hapus'}</button>
			</div>
		</div>
	{:else}
		<button type="button" class="btn-danger w-full" onclick={() => (confirmDelete = true)}><Trash size={20} /> Hapus transaksi</button>
	{/if}
</form>

<Sheet bind:open={addOpen} title="Tambah barang">
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
