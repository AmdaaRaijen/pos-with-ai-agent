<script lang="ts">
	import { goto } from '$app/navigation';
	import { dayLabel, rp } from '#lib/money.ts';
	import TrendChart from '#lib/components/TrendChart.svelte';
	import ChartLineUp from 'phosphor-svelte/lib/ChartLineUp';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let metric = $state<'profit' | 'total'>('profit');

	const periods = [
		{ id: '7', label: '7 hari' },
		{ id: '30', label: '30 hari' },
		{ id: 'bulan', label: 'Bulan ini' }
	];

	const sum = $derived({
		total: data.days.reduce((a, d) => a + d.total, 0),
		profit: data.days.reduce((a, d) => a + d.profit, 0),
		trx: data.days.reduce((a, d) => a + d.trx, 0)
	});
	const activeDays = $derived(data.days.filter((d) => d.trx > 0));
	const avg = $derived(activeDays.length ? Math.round(sum.profit / activeDays.length) : 0);
	const best = $derived(activeDays.reduce<(typeof data.days)[number] | null>((b, d) => (!b || d.profit > b.profit ? d : b), null));
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

{#if sum.trx === 0}
	<section class="rise rounded-[2rem] border border-dashed border-zinc-300 px-6 py-12 text-center" style="--i:2">
		<ChartLineUp size={44} class="mx-auto text-zinc-400" />
		<h2 class="mt-4 text-lg font-semibold">Belum ada penjualan</h2>
		<p class="mx-auto mt-1 max-w-[30ch] text-sm text-zinc-500">Setelah ada transaksi, untung dan grafik per hari muncul di sini.</p>
		<a href="/" class="btn-primary mt-6">Mulai jual</a>
	</section>
{:else}
	<section class="rise" style="--i:2">
		<p class="text-sm text-zinc-500">Untung bersih</p>
		<p class="text-4xl font-semibold tracking-tight text-emerald-700">{rp(sum.profit)}</p>
		<p class="mt-2 text-base text-zinc-600">
			Pemasukan <span class="font-semibold text-zinc-900">{rp(sum.total)}</span> dari {sum.trx} transaksi
		</p>
	</section>

	<section class="rise mt-6 rounded-[2rem] border border-zinc-200/70 bg-white p-4 shadow-lift" style="--i:3">
		<div class="mb-3 flex items-center justify-between gap-2">
			<h2 class="text-base font-semibold">Tren per hari</h2>
			<div class="grid grid-cols-2 gap-1 rounded-xl bg-zinc-100 p-1 text-xs font-semibold" role="tablist">
				<button role="tab" aria-selected={metric === 'profit'} class="press rounded-lg px-3 py-2 {metric === 'profit' ? 'bg-white shadow-sm' : 'text-zinc-500'}" onclick={() => (metric = 'profit')}>Untung</button>
				<button role="tab" aria-selected={metric === 'total'} class="press rounded-lg px-3 py-2 {metric === 'total' ? 'bg-white shadow-sm' : 'text-zinc-500'}" onclick={() => (metric = 'total')}>Pemasukan</button>
			</div>
		</div>
		<TrendChart days={data.days} {metric} />
		<p class="mt-2 text-xs text-zinc-400">Sentuh grafik untuk melihat angka tiap hari.</p>
	</section>

	<section class="rise mt-6 grid grid-cols-2 gap-3" style="--i:4">
		<div class="rounded-3xl bg-zinc-100 p-4">
			<p class="text-sm text-zinc-500">Rata-rata untung / hari jualan</p>
			<p class="mt-1 text-lg font-semibold">{rp(avg)}</p>
		</div>
		<div class="rounded-3xl bg-zinc-100 p-4">
			<p class="text-sm text-zinc-500">Hari terbaik</p>
			<p class="mt-1 text-lg font-semibold">{best ? dayLabel(best.day, false) : '-'}</p>
			<p class="text-sm text-emerald-700">{best ? rp(best.profit) : ''}</p>
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
