<script lang="ts">
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { dayLabel, rp } from '#lib/money.ts';
	import { toast } from '#lib/toast.svelte.ts';
	import Sheet from '#lib/components/Sheet.svelte';
	import MoneyInput from '#lib/components/MoneyInput.svelte';
	import TrendChart from '#lib/components/TrendChart.svelte';
	import ChartLineUp from 'phosphor-svelte/lib/ChartLineUp';
	import Receipt from 'phosphor-svelte/lib/Receipt';
	import Trash from 'phosphor-svelte/lib/Trash';
	import Plus from 'phosphor-svelte/lib/Plus';
	import type { keuangan } from '#lib/server/pages.ts';

	let { data }: { data: Awaited<ReturnType<typeof keuangan>> } = $props();

	let metric = $state<'net' | 'total'>('net');

	// Catat pengeluaran
	let expOpen = $state(false);
	let expName = $state('');
	let expAmount = $state(0);
	let expDate = $state('');
	let expSaving = $state(false);
	const expChips = ['Biaya keamanan', 'Kebersihan', 'Listrik', 'Transportasi'];

	function openExpense() {
		expName = '';
		expAmount = 0;
		expDate = data.today;
		expOpen = true;
	}

	const periods = [
		{ id: '7', label: '7 hari' },
		{ id: '30', label: '30 hari' },
		{ id: 'bulan', label: 'Bulan ini' }
	];

	const sum = $derived({
		total: data.days.reduce((a, d) => a + d.total, 0),
		profit: data.days.reduce((a, d) => a + d.profit, 0),
		expense: data.days.reduce((a, d) => a + d.expense, 0),
		trx: data.days.reduce((a, d) => a + d.trx, 0)
	});
	const net = $derived(sum.profit - sum.expense);
	const activeDays = $derived(data.days.filter((d) => d.trx > 0));
	const avg = $derived(activeDays.length ? Math.round(net / activeDays.length) : 0);
	const best = $derived(activeDays.reduce<(typeof data.days)[number] | null>((b, d) => (!b || d.profit - d.expense > b.profit - b.expense ? d : b), null));
	const topMax = $derived(Math.max(...data.items.map((i) => i.profit), 1));
</script>

<header class="rise mb-5">
	<h1 class="text-2xl font-semibold tracking-tight">Keuangan</h1>
	<p class="mt-1 text-sm text-zinc-500">{dayLabel(data.from, false)} sampai {dayLabel(data.today, false)}</p>
</header>

<div class="rise mb-5 grid grid-cols-3 gap-1 rounded-2xl bg-zinc-200/60 p-1 text-sm font-semibold" style="--i:1" role="tablist">
	{#each periods as p (p.id)}
		<button
			role="tab"
			aria-selected={data.period === p.id}
			class="press rounded-xl py-2.5 {data.period === p.id ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'}"
			onclick={() => goto(`?p=${p.id}`, { reset: false })}>{p.label}</button
		>
	{/each}
</div>

{#if sum.trx === 0 && data.expenses.length === 0}
	<section class="rise rounded-[2rem] border border-dashed border-zinc-300 px-6 py-12 text-center" style="--i:2">
		<ChartLineUp size={44} class="mx-auto text-zinc-400" />
		<h2 class="mt-4 text-lg font-semibold">Belum ada penjualan</h2>
		<p class="mx-auto mt-1 max-w-[30ch] text-sm text-zinc-500">Setelah ada transaksi, untung dan grafik per hari muncul di sini.</p>
		<a href="/" class="btn-primary mt-6">Mulai jual</a>
	</section>
{:else}
	<section class="rise" style="--i:2">
		<p class="text-sm text-zinc-500">Untung bersih</p>
		<p class="text-4xl font-semibold tracking-tight {net < 0 ? 'text-rose-700' : 'text-emerald-700'}">{rp(net)}</p>
		<p class="mt-2 text-base text-zinc-600">
			Pemasukan <span class="font-semibold text-zinc-900">{rp(sum.total)}</span> dari {sum.trx} transaksi
		</p>
		<p class="mt-1 text-sm text-zinc-500">
			Untung jualan {rp(sum.profit)}{sum.expense > 0 ? `, dikurangi pengeluaran lain ${rp(sum.expense)}` : ''}
		</p>
	</section>

	<section class="rise mt-6 rounded-[2rem] border border-zinc-200/70 bg-white p-4 shadow-lift" style="--i:3">
		<div class="mb-3 flex items-center justify-between gap-2">
			<h2 class="text-base font-semibold">Tren per hari</h2>
			<div class="grid grid-cols-2 gap-1 rounded-xl bg-zinc-100 p-1 text-xs font-semibold" role="tablist">
				<button role="tab" aria-selected={metric === 'net'} class="press rounded-lg px-3 py-2 {metric === 'net' ? 'bg-white shadow-sm' : 'text-zinc-500'}" onclick={() => (metric = 'net')}>Untung</button>
				<button role="tab" aria-selected={metric === 'total'} class="press rounded-lg px-3 py-2 {metric === 'total' ? 'bg-white shadow-sm' : 'text-zinc-500'}" onclick={() => (metric = 'total')}>Pemasukan</button>
			</div>
		</div>
		<TrendChart days={data.days} {metric} />
		<p class="mt-2 text-xs text-zinc-400">Sentuh grafik untuk melihat angka tiap hari.</p>
	</section>

	<section class="rise mt-6 grid grid-cols-2 gap-3" style="--i:4">
		<div class="rounded-3xl bg-zinc-100 p-4">
			<p class="text-sm text-zinc-500">Rata-rata untung bersih / hari jualan</p>
			<p class="mt-1 text-lg font-semibold">{rp(avg)}</p>
		</div>
		<div class="rounded-3xl bg-zinc-100 p-4">
			<p class="text-sm text-zinc-500">Hari terbaik</p>
			<p class="mt-1 text-lg font-semibold">{best ? dayLabel(best.day, false) : '-'}</p>
			<p class="text-sm text-emerald-700">{best ? rp(best.profit - best.expense) : ''}</p>
		</div>
	</section>

	{#if data.items.length}
		<section class="rise mt-8" style="--i:5">
			<h2 class="mb-3 px-1 text-base font-semibold">Paling menguntungkan</h2>
			<ul class="space-y-4">
				{#each data.items as it (it.name)}
					<li>
						<div class="flex items-baseline justify-between gap-3">
							<span class="truncate text-base font-medium">{it.name}</span>
							<span class="shrink-0 text-base font-semibold">{rp(it.profit)}</span>
						</div>
						<div class="mt-1.5 h-2 overflow-hidden rounded-full bg-zinc-100">
							<div class="h-full origin-left rounded-full bg-emerald-600" style="transform: scaleX({it.profit / topMax}); width: 100%"></div>
						</div>
						<p class="mt-1 text-sm text-zinc-500">{it.kind === 'emoney' ? `${it.qty} kali isi saldo` : `Terjual ${it.qty}`}</p>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
{/if}

<!-- Pengeluaran lain-lain -->
<section class="rise mt-8" style="--i:5">
	<div class="mb-1 flex items-center justify-between gap-3 px-1">
		<h2 class="text-base font-semibold">Pengeluaran lain-lain</h2>
		<button class="btn-soft !min-h-11 !px-4 text-sm" onclick={openExpense}><Plus size={18} weight="bold" /> Catat</button>
	</div>
	<p class="mb-3 px-1 text-sm text-zinc-500">Biaya di luar belanja barang, misalnya keamanan. Mengurangi untung bersih.</p>

	{#if data.expenses.length === 0}
		<div class="rounded-3xl border border-dashed border-zinc-300 px-5 py-8 text-center">
			<Receipt size={36} class="mx-auto text-zinc-400" />
			<p class="mt-3 text-base font-medium">Belum ada pengeluaran di periode ini</p>
			<p class="mx-auto mt-1 max-w-[32ch] text-sm text-zinc-500">Tekan Catat untuk menambah, misalnya biaya keamanan.</p>
		</div>
	{:else}
		<ul class="divide-y divide-zinc-100 overflow-hidden rounded-3xl border border-zinc-200/70 bg-white shadow-lift">
			{#each data.expenses as e (e.id)}
				<li class="flex items-center gap-3 px-4 py-3.5">
					<div class="min-w-0 flex-1">
						<p class="truncate text-base font-semibold">{e.name}</p>
						<p class="text-sm text-zinc-500">{dayLabel(e.spent_on)}{e.source === 'telegram' ? ' - dari Telegram' : ''}</p>
					</div>
					<span class="shrink-0 text-base font-semibold text-rose-700">-{rp(e.amount)}</span>
					<form
						method="POST"
						action="?/removeExpense"
						use:enhance={() => async ({ result, update }) => {
							if (result.type === 'success') toast('Pengeluaran dihapus');
							else toast('Gagal menghapus', 'error');
							await update();
						}}
					>
						<input type="hidden" name="id" value={e.id} />
						<button class="press grid size-11 place-items-center rounded-xl bg-rose-50 text-rose-700" aria-label="Hapus {e.name}"><Trash size={20} /></button>
					</form>
				</li>
			{/each}
		</ul>
	{/if}
</section>

{#if data.advice.length}
	<section class="rise mt-8" style="--i:6">
		<h2 class="mb-1 px-1 text-base font-semibold">Saran belanja stok</h2>
		<p class="mb-3 px-1 text-sm text-zinc-500">Supaya cukup untuk 7 hari, dihitung dari penjualan 2 minggu terakhir.</p>
		<ul class="divide-y divide-zinc-100 overflow-hidden rounded-3xl border border-zinc-200/70 bg-white shadow-lift">
			{#each data.advice as a (a.name)}
				<li class="flex items-center justify-between gap-3 px-4 py-3.5">
					<div class="min-w-0">
						<p class="truncate text-base font-semibold">{a.name}</p>
						<p class="text-sm text-zinc-500">Sisa {a.stock}{a.days_left !== null ? `, cukup ${a.days_left} hari` : ''}</p>
					</div>
					<span class="shrink-0 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-800">Beli {a.buy_qty}</span>
				</li>
			{/each}
		</ul>
	</section>
{/if}

<Sheet bind:open={expOpen} title="Catat pengeluaran">
	<form
		method="POST"
		action="?/addExpense"
		class="flex flex-col gap-5"
		use:enhance={() => {
			expSaving = true;
			return async ({ result, update }) => {
				expSaving = false;
				if (result.type === 'success') {
					expOpen = false;
					toast('Pengeluaran tercatat');
					await update();
				} else if (result.type === 'failure') {
					toast(String(result.data?.error ?? 'Gagal menyimpan'), 'error');
				} else {
					toast('Gagal menyimpan. Cek sambungan internet.', 'error');
				}
			};
		}}
	>
		<input type="hidden" name="amount" value={expAmount} />
		<div>
			<label class="label" for="expname">Untuk apa?</label>
			<input class="field" id="expname" name="name" maxlength="80" placeholder="Contoh: Biaya keamanan" bind:value={expName} required />
			<div class="mt-2 flex flex-wrap gap-2">
				{#each expChips as c (c)}
					<button type="button" class="press min-h-10 rounded-xl px-3.5 text-sm font-semibold {expName === c ? 'bg-emerald-700 text-white' : 'bg-zinc-100 text-zinc-700'}" onclick={() => (expName = c)}>{c}</button>
				{/each}
			</div>
		</div>
		<div>
			<label class="label" for="expamount">Jumlah</label>
			<MoneyInput id="expamount" bind:value={expAmount} />
		</div>
		<div>
			<label class="label" for="expdate">Tanggal</label>
			<input class="field" id="expdate" name="date" type="date" max={data.today} bind:value={expDate} required />
		</div>
		<button class="btn-primary" disabled={expSaving || expAmount <= 0 || !expName.trim()}>{expSaving ? 'Menyimpan...' : 'Simpan'}</button>
	</form>
</Sheet>
