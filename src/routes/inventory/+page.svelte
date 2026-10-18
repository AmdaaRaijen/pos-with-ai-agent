<script lang="ts">
	import { enhance } from '$app/forms';
	import { emoneyFee, rp, shortRp } from '#lib/money.ts';
	import { toast } from '#lib/toast.svelte.ts';
	import { label, type Product } from '#lib/types.ts';
	import Sheet from '#lib/components/Sheet.svelte';
	import MoneyInput from '#lib/components/MoneyInput.svelte';
	import Plus from 'phosphor-svelte/lib/Plus';
	import Package from 'phosphor-svelte/lib/Package';
	import Wallet from 'phosphor-svelte/lib/Wallet';
	import CaretRight from 'phosphor-svelte/lib/CaretRight';
	import MagnifyingGlass from 'phosphor-svelte/lib/MagnifyingGlass';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let q = $state('');
	let open = $state(false);
	let saving = $state(false);
	let confirmDelete = $state(false);

	// Isi form
	let editing = $state<Product | null>(null);
	let kind = $state<'barang' | 'emoney'>('barang');
	let name = $state('');
	let variant = $state('');
	const DEFAULT_CHIPS = ['Es', 'Hangat', 'Kecil', 'Besar'];
	let chips = $state([...DEFAULT_CHIPS]);
	// Tambah baru: boleh pilih beberapa varian sekaligus, harga jual diisi per varian
	let picked = $state<string[]>([]);
	let vsell = $state<Record<string, number>>({});
	let custom = $state('');
	let buy = $state(0);
	let profit = $state(0);
	let sell = $state(0);
	let stock = $state('');

	const list = $derived(data.products.filter((p) => label(p).toLowerCase().includes(q.trim().toLowerCase())));
	const emoneyItems = $derived(list.filter((p) => p.kind === 'emoney'));
	const goods = $derived(list.filter((p) => p.kind === 'barang'));
	const percent = $derived(sell > 0 && sell >= buy ? Math.round(((sell - buy) / sell) * 100) : 0);
	// Varian lain dari barang yang sama berbagi stok
	const siblings = $derived(
		kind === 'barang' && name.trim()
			? data.products.filter((p) => p.kind === 'barang' && p.id !== editing?.id && p.name.trim().toLowerCase() === name.trim().toLowerCase())
			: []
	);
	const multi = $derived(!editing && kind === 'barang');
	const taken = $derived(new Set(siblings.map((s) => (s.variant ?? '').toLowerCase())));
	const ruleFee = (n: number) => emoneyFee(n, data.emoney).fee;

	function openForm(p: Product | null, k: 'barang' | 'emoney' = 'barang') {
		editing = p;
		kind = p?.kind ?? k;
		name = p?.name ?? '';
		variant = p?.variant ?? '';
		buy = p?.buy_price ?? 0;
		sell = p?.sell_price ?? 0;
		profit = Math.max(0, sell - buy);
		stock = p ? String(p.stock) : '';
		confirmDelete = false;
		picked = [];
		vsell = {};
		custom = '';
		chips = [...DEFAULT_CHIPS];
		open = true;
	}

	function toggle(v: string) {
		if (picked.includes(v)) picked = picked.filter((x) => x !== v);
		else {
			picked = [...picked, v];
			vsell[v] = sell || buy + profit;
		}
	}

	function addCustom() {
		const v = custom.trim().slice(0, 30);
		custom = '';
		if (!v) return;
		const known = chips.find((c) => c.toLowerCase() === v.toLowerCase());
		if (!known) chips = [...chips, v];
		const use = known ?? v;
		if (!picked.includes(use) && !taken.has(use.toLowerCase())) toggle(use);
	}

	const recalcSell = () => {
		sell = buy + profit;
		for (const v of picked) vsell[v] = sell;
	};
	const recalcProfit = () => (profit = Math.max(0, sell - buy));
</script>

<header class="rise mb-5 flex items-end justify-between gap-3">
	<div>
		<h1 class="text-2xl font-semibold tracking-tight">Stok barang</h1>
		<p class="mt-1 text-sm text-zinc-500">{goods.length} barang{emoneyItems.length ? `, ${emoneyItems.length} saldo e-money` : ''}</p>
	</div>
	<button class="btn-primary !min-h-12 !px-4" onclick={() => openForm(null)}><Plus size={20} weight="bold" /> Tambah</button>
</header>

<div class="rise relative mb-5" style="--i:1">
	<MagnifyingGlass size={20} class="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-zinc-400" />
	<input class="field pl-11" type="search" placeholder="Cari barang" aria-label="Cari barang" bind:value={q} />
</div>

{#if data.products.length === 0}
	<section class="rise rounded-[2rem] border border-dashed border-zinc-300 px-6 py-12 text-center" style="--i:2">
		<Package size={44} class="mx-auto text-zinc-400" />
		<h2 class="mt-4 text-lg font-semibold">Stok masih kosong</h2>
		<p class="mx-auto mt-1 max-w-[30ch] text-sm text-zinc-500">Tambah barang pertama. Isi nama, harga beli, dan untung yang diinginkan.</p>
		<button class="btn-primary mt-6" onclick={() => openForm(null)}>Tambah barang</button>
	</section>
{:else}
	{#if emoneyItems.length > 0}
		<section class="rise mb-6" style="--i:2">
			<h2 class="mb-2 px-1 text-sm font-semibold text-zinc-600">Saldo e-money</h2>
			<ul class="space-y-3">
				{#each emoneyItems as p (p.id)}
					<li>
						<button class="press flex w-full items-center gap-3 rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-left" onclick={() => openForm(p)}>
							<Wallet size={26} weight="duotone" class="shrink-0 text-emerald-700" />
							<span class="min-w-0 flex-1">
								<span class="block text-base font-semibold">{p.name}</span>
								<span class="block text-sm text-emerald-900">200rb: {shortRp(ruleFee(200_000))}, 220rb: {shortRp(ruleFee(220_000))}</span>
							</span>
							<CaretRight size={18} class="text-emerald-700/60" />
						</button>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if goods.length > 0}
		<section class="rise" style="--i:3">
			<h2 class="mb-2 px-1 text-sm font-semibold text-zinc-600">Barang</h2>
			<ul class="divide-y divide-zinc-100 overflow-hidden rounded-3xl border border-zinc-200/70 bg-white shadow-lift">
				{#each goods as p (p.id)}
					<li>
						<button class="press flex min-h-18 w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-zinc-50" onclick={() => openForm(p)}>
							<span class="min-w-0 flex-1">
								<span class="block truncate text-base font-semibold">{label(p)}</span>
								<span class="block text-sm text-zinc-500"><span class="whitespace-nowrap">Beli {rp(p.buy_price)}</span> <span class="whitespace-nowrap">{p.sell_price === 0 ? 'tidak dijual' : `untung ${rp(p.sell_price - p.buy_price)}`}</span></span>
							</span>
							<span class="text-right">
								<span class="block text-base font-semibold">{p.sell_price === 0 ? 'Pendukung' : rp(p.sell_price)}</span>
								<span class="block text-sm font-medium {p.stock <= 0 ? 'text-rose-600' : p.stock <= 3 ? 'text-amber-700' : 'text-zinc-500'}">
									{p.stock <= 0 ? 'Habis' : `Sisa ${p.stock}`}
								</span>
							</span>
							<CaretRight size={18} class="text-zinc-300" />
						</button>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if list.length === 0}
		<p class="py-12 text-center text-zinc-500">Tidak ada barang bernama "{q}".</p>
	{/if}

	{#if !data.products.some((p) => p.kind === 'emoney') && !q}
		<button class="press mt-6 flex w-full items-center gap-3 rounded-3xl border border-dashed border-emerald-300 px-4 py-4 text-left text-emerald-800" onclick={() => openForm(null, 'emoney')}>
			<Wallet size={24} weight="duotone" />
			<span class="text-base font-medium">Jual saldo e-money? Tambah di sini</span>
		</button>
	{/if}
{/if}

<Sheet bind:open title={editing ? 'Ubah ' + (kind === 'emoney' ? 'saldo' : 'barang') : 'Tambah'}>
	<form
		method="POST"
		action="?/save"
		class="flex flex-col gap-5"
		use:enhance={() => {
			saving = true;
			return async ({ result, update }) => {
				saving = false;
				if (result.type === 'success') {
					open = false;
					toast('Tersimpan');
					await update();
				} else if (result.type === 'failure') {
					toast(String(result.data?.error ?? 'Gagal menyimpan'), 'error');
				} else {
					toast('Gagal menyimpan. Cek sambungan internet.', 'error');
				}
			};
		}}
	>
		<input type="hidden" name="id" value={editing?.id ?? ''} />
		<input type="hidden" name="kind" value={kind} />
		<input type="hidden" name="buy_price" value={buy} />
		<input type="hidden" name="sell_price" value={sell} />
		{#if multi && picked.length}
			<input type="hidden" name="variants" value={JSON.stringify(picked.map((v) => ({ variant: v, sell_price: vsell[v] ?? 0 })))} />
		{/if}

		{#if !editing}
			<div class="grid grid-cols-2 gap-1 rounded-2xl bg-zinc-100 p-1 text-sm font-semibold" role="tablist">
				<button type="button" role="tab" aria-selected={kind === 'barang'} class="press rounded-xl py-2.5 {kind === 'barang' ? 'bg-white shadow-sm' : 'text-zinc-500'}" onclick={() => (kind = 'barang')}>Barang</button>
				<button type="button" role="tab" aria-selected={kind === 'emoney'} class="press rounded-xl py-2.5 {kind === 'emoney' ? 'bg-white shadow-sm' : 'text-zinc-500'}" onclick={() => (kind = 'emoney')}>Saldo e-money</button>
			</div>
		{/if}

		<div>
			<label class="label" for="name">{kind === 'emoney' ? 'Nama e-money' : 'Nama barang'}</label>
			<input class="field" id="name" name="name" maxlength="60" placeholder={kind === 'emoney' ? 'Contoh: DANA' : 'Contoh: Kopi'} bind:value={name} required />
		</div>

		{#if multi}
			<div>
				<span class="label">Varian (boleh pilih lebih dari satu, boleh kosong)</span>
				<div class="flex flex-wrap gap-2">
					{#each chips as c (c)}
						{@const sudah = taken.has(c.toLowerCase())}
						<button
							type="button"
							aria-pressed={picked.includes(c)}
							disabled={sudah}
							class="press min-h-11 rounded-xl px-4 text-sm font-semibold disabled:opacity-40 {picked.includes(c) ? 'bg-emerald-700 text-white' : 'bg-zinc-100 text-zinc-700'}"
							onclick={() => toggle(c)}>{c}{sudah ? ' (sudah ada)' : ''}</button
						>
					{/each}
				</div>
				<div class="mt-3 flex gap-2">
					<input
						class="field"
						placeholder="Varian lain, misal Jumbo"
						maxlength="30"
						aria-label="Varian lain"
						bind:value={custom}
						onkeydown={(e) => {
							if (e.key === 'Enter') {
								e.preventDefault();
								addCustom();
							}
						}}
					/>
					<button type="button" class="btn-soft shrink-0" onclick={addCustom}>Tambah</button>
				</div>
				<p class="mt-2 text-sm text-zinc-500">Pakai kalau harganya beda, misalnya Es dan Hangat. Semua varian memakai satu stok yang sama.</p>
			</div>
		{:else if kind === 'barang'}
			<div>
				<label class="label" for="variant">Varian (boleh kosong)</label>
				<input class="field" id="variant" name="variant" maxlength="30" placeholder="Contoh: Es" bind:value={variant} />
				<div class="mt-2 flex flex-wrap gap-2">
					{#each chips as c (c)}
						<button type="button" class="press min-h-10 rounded-xl px-3.5 text-sm font-semibold {variant === c ? 'bg-emerald-700 text-white' : 'bg-zinc-100 text-zinc-700'}" onclick={() => (variant = variant === c ? '' : c)}>{c}</button>
					{/each}
				</div>
			</div>
		{/if}

		{#if kind === 'barang'}
			<div>
				<label class="label" for="buy">Harga beli (modal)</label>
				<MoneyInput id="buy" bind:value={buy} onchange={recalcSell} />
			</div>
			<div>
				<label class="label" for="profit">Untung yang diinginkan</label>
				<MoneyInput id="profit" bind:value={profit} onchange={recalcSell} />
				{#if multi && picked.length}<p class="mt-2 text-sm text-zinc-500">Mengisi harga jual semua varian. Harga tiap varian masih bisa diubah sendiri di bawah.</p>{/if}
			</div>
			{#if multi && picked.length}
				<div class="space-y-4 rounded-3xl bg-emerald-50 p-4">
					<p class="text-sm font-semibold text-emerald-900">Harga jual tiap varian</p>
					{#each picked as v (v)}
						<div>
							<label class="label !text-emerald-900" for="vs-{v}">{name.trim() || 'Barang'} - {v}</label>
							<MoneyInput id="vs-{v}" bind:value={vsell[v]} />
							<p class="mt-1.5 text-sm text-emerald-900">
								{#if (vsell[v] ?? 0) === 0}
									Pendukung, tidak dihitung sebagai pemasukan.
								{:else if (vsell[v] ?? 0) < buy}
									<span class="font-semibold text-rose-700">Di bawah modal, rugi {rp(buy - (vsell[v] ?? 0))}.</span>
								{:else}
									Untung {rp((vsell[v] ?? 0) - buy)} per barang.
								{/if}
							</p>
						</div>
					{/each}
				</div>
			{:else}
			<div class="rounded-3xl bg-emerald-50 p-4">
				<label class="label !text-emerald-900" for="sell">Harga jual</label>
				<MoneyInput id="sell" bind:value={sell} onchange={recalcProfit} />
				<button type="button" class="press mt-3 min-h-10 rounded-xl bg-white px-3.5 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200" onclick={() => { sell = 0; profit = 0; }}>Tidak dijual (Rp 0), misal sedotan atau cup</button>
				<p class="mt-2 text-sm text-emerald-900">
					{#if sell === 0}
						<span class="font-semibold">Barang pendukung.</span> Tidak dihitung sebagai pemasukan. Modal {rp(buy)} tercatat sebagai biaya saat dipakai.
					{:else if sell < buy}
						<span class="font-semibold text-rose-700">Harga jual di bawah modal, rugi {rp(buy - sell)}.</span>
					{:else}
						Untung {rp(sell - buy)} per barang{percent ? ` (${percent}% dari harga jual)` : ''}.
					{/if}
				</p>
			</div>
			{/if}
			<div>
				<label class="label" for="stock">Stok sekarang</label>
				<input class="field" id="stock" name="stock" inputmode="numeric" pattern="[0-9]*" placeholder="0" bind:value={stock} />
				{#if siblings.length}
					<p class="mt-2 text-sm text-emerald-800">Stok ini dipakai bersama varian lain ({siblings.map((s) => s.variant ?? 'biasa').join(', ')}). Kalau diubah, semua varian ikut berubah.</p>
				{/if}
			</div>
		{:else}
			<div class="rounded-3xl bg-emerald-50 p-4 text-sm text-emerald-900">
				<p class="font-semibold">Harga jual dihitung otomatis</p>
				<p class="mt-1">
					Untung {rp(data.emoney.profit)} tiap kelipatan {rp(data.emoney.block)}, ditambah biaya admin {rp(data.emoney.admin)}
					{data.emoney.adminMode === 'flat' ? 'sekali per transaksi' : 'tiap kelipatan'}.
				</p>
				<p class="mt-2">Contoh: {rp(200_000)} biayanya {rp(ruleFee(200_000))}, {rp(220_000)} biayanya {rp(ruleFee(220_000))}.</p>
			</div>
		{/if}

		<button class="btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
	</form>

	{#if editing && editing.kind === 'barang'}
		<button
			type="button"
			class="btn-soft mt-3 w-full"
			onclick={() => {
				const base = editing!;
				openForm(null);
				name = base.name;
				buy = base.buy_price;
				sell = base.sell_price;
				stock = String(base.stock);
				profit = Math.max(0, sell - buy);
			}}>Tambah varian lain dari "{editing.name}"</button
		>
	{/if}

	{#if editing}
		<form
			method="POST"
			action="?/remove"
			class="mt-3"
			use:enhance={() => async ({ result, update }) => {
				if (result.type === 'success') {
					open = false;
					toast('Sudah dihapus');
					await update();
				} else toast('Gagal menghapus', 'error');
			}}
		>
			<input type="hidden" name="id" value={editing.id} />
			{#if confirmDelete}
				<p class="mb-3 text-center text-sm text-zinc-600">Yakin hapus "{editing.name}"? Riwayat transaksi tetap aman.</p>
				<div class="grid grid-cols-2 gap-3">
					<button type="button" class="btn-soft" onclick={() => (confirmDelete = false)}>Batal</button>
					<button class="btn-danger">Ya, hapus</button>
				</div>
			{:else}
				<button type="button" class="btn-danger w-full" onclick={() => (confirmDelete = true)}>Hapus</button>
			{/if}
		</form>
	{/if}
</Sheet>
