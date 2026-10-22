<script lang="ts">
	import { dayLabel, rp, timeLabel, wibDate } from '#lib/money.ts';
	import TransaksiTabs from '#lib/components/TransaksiTabs.svelte';
	import CaretRight from 'phosphor-svelte/lib/CaretRight';
	import ClockCounterClockwise from 'phosphor-svelte/lib/ClockCounterClockwise';
	import type { riwayat } from '#lib/server/pages.ts';

	let { data }: { data: Awaited<ReturnType<typeof riwayat>> } = $props();

	const groups = $derived.by(() => {
		const map = new Map<string, typeof data.sales>();
		for (const s of data.sales) {
			const d = wibDate(new Date(s.created_at));
			map.set(d, [...(map.get(d) ?? []), s]);
		}
		return [...map.entries()];
	});
</script>

<header class="rise mb-5">
	<h1 class="text-2xl font-semibold tracking-tight">Transaksi</h1>
	<p class="mt-1 text-sm text-zinc-500">14 hari terakhir. Ketuk untuk melihat atau mengubah.</p>
</header>

<div class="rise mb-5" style="--i:1"><TransaksiTabs active="riwayat" /></div>

{#if groups.length === 0}
	<section class="rise rounded-[2rem] border border-dashed border-zinc-300 px-6 py-12 text-center" style="--i:2">
		<ClockCounterClockwise size={44} class="mx-auto text-zinc-400" />
		<h2 class="mt-4 text-lg font-semibold">Belum ada transaksi</h2>
		<p class="mx-auto mt-1 max-w-[30ch] text-sm text-zinc-500">Transaksi yang sudah disimpan akan muncul di sini.</p>
		<a href="/" class="btn-primary mt-6">Mulai jual</a>
	</section>
{:else}
	<div class="space-y-6">
		{#each groups as [day, list], gi (day)}
			<section class="rise" style="--i:{Math.min(gi, 6) + 2}">
				<div class="mb-2 flex items-baseline justify-between px-1">
					<h2 class="text-sm font-semibold text-zinc-600">{day === wibDate() ? 'Hari ini' : dayLabel(day)}</h2>
					<span class="text-sm text-zinc-500">{rp(list.reduce((a, s) => a + s.total, 0))}</span>
				</div>
				<ul class="divide-y divide-zinc-100 overflow-hidden rounded-3xl border border-zinc-200/70 bg-white shadow-lift">
					{#each list as s (s.id)}
						<li>
							<a href="/riwayat/{s.id}" class="press flex min-h-16 items-center gap-3 px-4 py-3.5 hover:bg-zinc-50">
								<div class="min-w-0 flex-1">
									<p class="truncate text-base font-semibold">
										{s.sale_items.map((i) => (i.kind === 'emoney' ? i.name + ' (saldo)' : i.qty > 1 ? `${i.name} x${i.qty}` : i.name)).join(', ')}
									</p>
									<p class="text-sm text-zinc-500">
										{timeLabel(s.created_at)}{s.source === 'telegram' ? ' - dari Telegram' : ''}{s.note ? ` - ${s.note}` : ''}
									</p>
								</div>
								<div class="text-right">
									<p class="text-base font-semibold">{rp(s.total)}</p>
									<p class="text-sm font-medium {s.profit < 0 ? 'text-rose-700' : 'text-emerald-700'}">{s.profit < 0 ? '' : '+'}{rp(s.profit)}</p>
								</div>
								<CaretRight size={18} class="text-zinc-300" />
							</a>
						</li>
					{/each}
				</ul>
			</section>
		{/each}
	</div>
{/if}
