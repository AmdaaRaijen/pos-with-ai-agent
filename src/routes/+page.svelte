<script lang="ts">
	import { enhance } from '$app/forms';
	import { cart } from '#lib/cart.svelte.ts';
	import { emoneyFee, rp, shortRp } from '#lib/money.ts';
	import { toast } from '#lib/toast.svelte.ts';
	import { label, type Product } from '#lib/types.ts';
	import Sheet from '#lib/components/Sheet.svelte';
	import MoneyInput from '#lib/components/MoneyInput.svelte';
	import TransaksiTabs from '#lib/components/TransaksiTabs.svelte';
	import MagnifyingGlass from 'phosphor-svelte/lib/MagnifyingGlass';
	import Plus from 'phosphor-svelte/lib/Plus';
	import Minus from 'phosphor-svelte/lib/Minus';
	import Trash from 'phosphor-svelte/lib/Trash';
	import ShoppingBag from 'phosphor-svelte/lib/ShoppingBag';
	import Wallet from 'phosphor-svelte/lib/Wallet';
	import Package from 'phosphor-svelte/lib/Package';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let q = $state('');
	let cartOpen = $state(false);
	let saving = $state(false);

	const shown = $derived(data.products.filter((p) => label(p).toLowerCase().includes(q.trim().toLowerCase())));

	// Barang bernama sama (beda varian, misal Es/Hangat) digabung jadi satu kotak
	type Tile = { key: string; items: Product[] };
	const tiles = $derived.by(() => {
		const out: Tile[] = [];
		const byName = new Map<string, Tile>();
		for (const p of shown) {
			if (p.kind === 'emoney') {
				out.push({ key: p.id, items: [p] });
				continue;
			}
			const k = p.name.trim().toLowerCase();
			const t = byName.get(k);
			if (t) t.items.push(p);
			else {
				const n = { key: k, items: [p] };
				byName.set(k, n);
				out.push(n);
			}
		}
		return out;
	});

	let pick = $state<Tile | null>(null);
	let pickOpen = $state(false);
	const totals = $derived(cart.totals(data.emoney));
	const hasGoods = $derived(data.products.some((p) => p.kind === 'barang'));

	// E-money
	let emoneyFor = $state<Product | null>(null);
	let emoneyOpen = $state(false);
	let nominal = $state(0);
	let paid = $state(0);
	const quick = [100_000, 200_000, 300_000, 500_000, 1_000_000];
	const fee = $derived(emoneyFee(nominal, paid, data.emoney));

	function tap(p: Product) {
		if (p.kind === 'emoney') {
			emoneyFor = p;
			nominal = 0;
			paid = 0;
			emoneyOpen = true;
		} else if (p.stock > 0) {
			cart.addGoods(p);
			navigator.vibrate?.(8);
		}
	}

	function tapTile(t: Tile) {
		if (t.items.length > 1) {
			pick = t;
			pickOpen = true;
		} else tap(t.items[0]);
	}

	function addEmoney() {
		if (!emoneyFor || nominal <= 0 || paid < nominal) return;
		cart.addEmoney(emoneyFor, nominal, paid);
		emoneyOpen = false;
		toast('Saldo masuk keranjang');
	}
</script>

<header class="rise mb-5">
	<h1 class="text-2xl font-semibold tracking-tight">Transaksi</h1>
	<p class="mt-1 text-sm text-zinc-500">
		Hari ini: masuk <span class="font-semibold text-zinc-800">{rp(data.today.total)}</span>, untung
		<span class="font-semibold text-emerald-700">{rp(data.today.profit)}</span>
	</p>
</header>

<div class="rise mb-4" style="--i:1"><TransaksiTabs active="baru" /></div>

<div class="rise relative mb-4" style="--i:2">
	<MagnifyingGlass size={20} class="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-zinc-400" />
	<input class="field pl-11" type="search" placeholder="Cari barang" aria-label="Cari barang" bind:value={q} />
</div>

{#if data.products.length === 0}
	<section class="rise rounded-[2rem] border border-dashed border-zinc-300 px-6 py-12 text-center" style="--i:3">
		<Package size={44} class="mx-auto text-zinc-400" />
		<h2 class="mt-4 text-lg font-semibold">Belum ada barang</h2>
		<p class="mx-auto mt-1 max-w-[30ch] text-sm text-zinc-500">Tambah barang dulu di menu Stok, nanti muncul di sini untuk dijual.</p>
		<a href="/inventory" class="btn-primary mt-6">Ke menu Stok</a>
	</section>
{:else if shown.length === 0}
	<p class="py-12 text-center text-zinc-500">Tidak ada barang bernama "{q}".</p>
{:else}
	<ul class="grid grid-cols-2 gap-3">
		{#each tiles as t, i (t.key)}
			{@const p = t.items[0]}
			{@const grouped = t.items.length > 1}
			{@const inCart = t.items.reduce((a, x) => a + cart.qtyOf(x.id), 0)}
			{@const out = p.kind === 'barang' && t.items.every((x) => x.stock <= 0)}
			{@const minPrice = Math.min(...t.items.map((x) => x.sell_price))}
			<li class="rise {p.kind === 'emoney' ? 'col-span-2' : ''}" style="--i:{Math.min(i, 8) + 3}">
				<button
					class="press relative flex w-full flex-col rounded-3xl border p-4 text-left shadow-lift {p.kind === 'emoney'
						? 'gap-1 border-emerald-200 bg-emerald-50'
						: 'min-h-28 justify-between border-zinc-200/70 bg-white'} {out ? 'opacity-45' : ''}"
					onclick={() => tapTile(t)}
					disabled={out}
					aria-label="{grouped ? p.name : label(p)}, {p.kind === 'emoney' ? 'isi saldo' : grouped ? 'pilih varian' : rp(p.sell_price)}"
				>
					{#if inCart > 0}
						<span class="absolute -top-2 -right-2 grid size-8 place-items-center rounded-full bg-emerald-700 text-sm font-bold text-white ring-4 ring-zinc-50">{inCart}</span>
					{/if}
					<span class="flex items-start gap-2 text-base leading-snug font-semibold">
						{#if p.kind === 'emoney'}<Wallet size={22} weight="duotone" class="mt-0.5 shrink-0 text-emerald-700" />{/if}
						{grouped ? p.name : label(p)}
					</span>
					{#if p.kind === 'emoney'}
						<span class="text-sm text-emerald-800">Isi saldo, untung dihitung dari uang yang dibayar pembeli</span>
					{:else}
						<span class="mt-3">
							<span class="block text-lg font-semibold {minPrice === 0 ? 'text-zinc-500' : ''}">{minPrice === 0 ? 'Pendukung' : rp(minPrice)}</span>
							{#if grouped}
								<span class="block text-sm {out ? 'font-semibold text-rose-600' : 'text-zinc-500'}">{out ? 'Habis' : `${t.items.length} pilihan, sisa ${p.stock}`}</span>
							{:else}
								<span class="block text-sm {out ? 'font-semibold text-rose-600' : p.stock <= 3 ? 'font-medium text-amber-700' : 'text-zinc-500'}">
									{out ? 'Habis' : `Sisa ${p.stock}`}
								</span>
							{/if}
						</span>
					{/if}
				</button>
			</li>
		{/each}
	</ul>
	{#if !hasGoods}
		<p class="mt-4 text-center text-sm text-zinc-500">Belum ada barang biasa. Tambah di menu Stok.</p>
	{/if}
{/if}

<!-- Bar keranjang -->
{#if cart.count > 0}
	<div class="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 px-4">
		<button
			class="rise press mx-auto flex w-full max-w-xl items-center justify-between rounded-3xl bg-emerald-700 px-5 py-4 text-white shadow-lift"
			onclick={() => (cartOpen = true)}
		>
			<span class="flex items-center gap-3 text-base font-semibold">
				<ShoppingBag size={24} weight="fill" />
				{cart.count} barang
			</span>
			<span class="text-lg font-semibold">{rp(totals.pay)}</span>
		</button>
	</div>
{/if}

<!-- Keranjang -->
<Sheet bind:open={cartOpen} title="Keranjang">
	{#if cart.items.length === 0}
		<p class="py-8 text-center text-zinc-500">Keranjang kosong.</p>
	{:else}
		<form
			method="POST"
			action="?/save"
			use:enhance={() => {
				saving = true;
				return async ({ result, update }) => {
					saving = false;
					if (result.type === 'success') {
						cart.clear();
						cartOpen = false;
						toast('Transaksi tersimpan');
						await update();
					} else if (result.type === 'failure') {
						toast(String(result.data?.error ?? 'Gagal menyimpan'), 'error');
					} else {
						toast('Gagal menyimpan. Cek sambungan internet.', 'error');
					}
				};
			}}
		>
			<input type="hidden" name="lines" value={JSON.stringify(cart.lines())} />

			<ul class="divide-y divide-zinc-100">
				{#each cart.items as it, idx (idx)}
					<li class="flex items-center gap-3 py-3.5">
						<div class="min-w-0 flex-1">
							<p class="truncate text-base font-semibold">{label(it.product)}</p>
							{#if it.product.kind === 'emoney'}
								{@const f = emoneyFee(it.nominal ?? 0, it.paid ?? 0, data.emoney)}
								<p class="text-sm text-zinc-500">Saldo {rp(it.nominal ?? 0)}, biaya {rp(f.fee)}</p>
								<p class="text-sm font-semibold">{rp(it.paid ?? 0)}</p>
							{:else}
								<p class="text-sm text-zinc-500">{rp(it.product.sell_price)} x {it.qty}</p>
								<p class="text-sm font-semibold">{rp(it.product.sell_price * it.qty)}</p>
							{/if}
						</div>
						{#if it.product.kind === 'barang'}
							<div class="flex items-center gap-1 rounded-2xl bg-zinc-100 p-1">
								<button type="button" class="press grid size-11 place-items-center rounded-xl bg-white" onclick={() => cart.change(idx, -1)} aria-label="Kurangi"><Minus size={18} weight="bold" /></button>
								<span class="w-9 text-center text-base font-semibold">{it.qty}</span>
								<button type="button" class="press grid size-11 place-items-center rounded-xl bg-white disabled:opacity-40" disabled={!cart.canAdd(it.product)} onclick={() => cart.change(idx, 1)} aria-label="Tambah"><Plus size={18} weight="bold" /></button>
							</div>
						{:else}
							<button type="button" class="press grid size-11 place-items-center rounded-xl bg-rose-50 text-rose-700" onclick={() => cart.remove(idx)} aria-label="Hapus"><Trash size={20} /></button>
						{/if}
					</li>
				{/each}
			</ul>

			<div class="mt-2 mb-5">
				<label class="label" for="note">Catatan (boleh kosong)</label>
				<input class="field" id="note" name="note" maxlength="200" placeholder="Misal: nama pembeli" bind:value={cart.note} />
			</div>

			<dl class="mb-5 space-y-2 rounded-3xl bg-zinc-50 p-4 text-base">
				<div class="flex justify-between"><dt class="text-zinc-600">Total belanja</dt><dd class="font-semibold">{rp(totals.total)}</dd></div>
				{#if totals.pay !== totals.total}
					<div class="flex justify-between"><dt class="text-zinc-600">Saldo e-money</dt><dd class="font-semibold">{rp(totals.pay - totals.total)}</dd></div>
				{/if}
				<div class="flex justify-between border-t border-zinc-200 pt-2 text-lg"><dt class="font-semibold">Pelanggan bayar</dt><dd class="font-bold">{rp(totals.pay)}</dd></div>
				<div class="flex justify-between text-sm"><dt class="text-zinc-500">Untung toko</dt><dd class="font-semibold text-emerald-700">{rp(totals.profit)}</dd></div>
			</dl>

			<div class="grid grid-cols-[auto_1fr] gap-3">
				<button type="button" class="btn-soft" onclick={() => { cart.clear(); cartOpen = false; }}>Kosongkan</button>
				<button class="btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan transaksi'}</button>
			</div>
		</form>
	{/if}
</Sheet>

<!-- Saldo e-money -->
<Sheet bind:open={emoneyOpen} title={emoneyFor ? `Saldo ${emoneyFor.name}` : 'Saldo'}>
	<div class="flex flex-wrap gap-2">
		{#each quick as n (n)}
			<button
				class="press min-h-12 rounded-2xl border px-4 text-base font-semibold {nominal === n ? 'border-emerald-700 bg-emerald-50 text-emerald-800' : 'border-zinc-200 bg-white'}"
				onclick={() => ((nominal = n), (paid = n + data.emoney.admin))}
			>
				{shortRp(n)}
			</button>
		{/each}
	</div>

	<div class="mt-5">
		<label class="label" for="nominal">Atau ketik nominal</label>
		<MoneyInput id="nominal" bind:value={nominal} placeholder="Contoh 250.000" />
	</div>

	<div class="mt-5">
		<label class="label" for="paid">Pembeli bayar</label>
		<MoneyInput id="paid" bind:value={paid} placeholder="Uang yang diterima dari pembeli" />
	</div>

	<div class="mt-5 rounded-3xl bg-emerald-50 p-4" aria-live="polite">
		{#if nominal > 0}
			<p class="text-sm text-emerald-900">Biaya admin {rp(fee.admin)} per transaksi</p>
			<p class="text-2xl font-bold tracking-tight text-emerald-900">Untung {rp(fee.profit)}</p>
			<p class="mt-2 text-sm text-emerald-900">Biaya yang diterima toko {rp(fee.fee)} (bayar {rp(paid)} dikurangi saldo {rp(nominal)})</p>
		{:else}
			<p class="text-sm text-emerald-900">Pilih nominal saldo, lalu isi uang yang dibayar pembeli.</p>
		{/if}
	</div>

	<button class="btn-primary mt-5 w-full" disabled={nominal <= 0 || paid < nominal} onclick={addEmoney}>Masukkan ke keranjang</button>
</Sheet>

<!-- Pilih varian -->
<Sheet bind:open={pickOpen} title={pick ? pick.items[0].name : 'Pilih'}>
	<ul class="space-y-3">
		{#each pick?.items ?? [] as v (v.id)}
			{@const n = cart.qtyOf(v.id)}
			{@const out = v.stock <= 0}
			<li>
				<button
					class="press relative flex w-full items-center justify-between gap-3 rounded-3xl border border-zinc-200 bg-white px-5 py-4 text-left disabled:opacity-45"
					disabled={out}
					onclick={() => {
						cart.addGoods(v);
						navigator.vibrate?.(8);
					}}
				>
					<span>
						<span class="block text-lg font-semibold">{v.variant ?? 'Biasa'}</span>
						<span class="block text-sm {out ? 'font-semibold text-rose-600' : v.stock <= 3 ? 'font-medium text-amber-700' : 'text-zinc-500'}">{out ? 'Habis' : `Sisa ${v.stock} (dipakai bersama)`}</span>
					</span>
					<span class="flex items-center gap-3">
						{#if n > 0}<span class="grid size-8 place-items-center rounded-full bg-emerald-700 text-sm font-bold text-white">{n}</span>{/if}
						<span class="text-lg font-semibold">{rp(v.sell_price)}</span>
					</span>
				</button>
			</li>
		{/each}
	</ul>
	<button class="btn-primary mt-5 w-full" onclick={() => (pickOpen = false)}>Selesai</button>
</Sheet>
