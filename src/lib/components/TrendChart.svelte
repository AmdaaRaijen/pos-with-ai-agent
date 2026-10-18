<script lang="ts">
	import { dayLabel, rp, shortRp } from '#lib/money.ts';
	import type { DayStat } from '#lib/types.ts';

	let { days, metric }: { days: DayStat[]; metric: 'profit' | 'total' } = $props();

	const W = 600;
	const H = 240;
	const pad = { l: 56, r: 22, t: 14, b: 34 };

	let picked = $state<number | null>(null);

	const values = $derived(days.map((d) => d[metric]));
	const max = $derived(niceMax(Math.max(...values, 0)));
	const x = (i: number) => pad.l + (days.length <= 1 ? (W - pad.l - pad.r) / 2 : (i * (W - pad.l - pad.r)) / (days.length - 1));
	const y = (v: number) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
	const line = $derived(values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' '));
	const area = $derived(days.length ? `${line} L${x(days.length - 1).toFixed(1)} ${H - pad.b} L${x(0).toFixed(1)} ${H - pad.b} Z` : '');
	const ticks = $derived([0, 0.5, 1].map((f) => f * max));
	const sel = $derived(picked ?? days.length - 1);
	const labelEvery = $derived(Math.max(1, Math.ceil(days.length / 6)));

	function niceMax(v: number) {
		if (v <= 0) return 10_000;
		// Batas atas bulat dan genap, supaya garis tengah juga angka bulat
		const p = 10 ** Math.floor(Math.log10(v));
		let m = Math.ceil(v / p);
		if (m % 2) m++;
		return m * p;
	}
</script>

{#if days.length}
	<p class="mb-1 min-h-6 text-sm text-zinc-500" aria-live="polite">
		{dayLabel(days[sel].day)}:
		<span class="font-semibold text-zinc-900">{rp(days[sel][metric])}</span>
		<span class="text-zinc-400"> - {days[sel].trx} transaksi</span>
	</p>
	<svg viewBox="0 0 {W} {H}" class="h-auto w-full touch-pan-y select-none" role="img" aria-label="Grafik {metric === 'profit' ? 'untung' : 'pemasukan'} per hari">
		{#each ticks as t (t)}
			<line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} class="stroke-zinc-200" stroke-dasharray={t === 0 ? '' : '3 4'} />
			<text x={pad.l - 10} y={y(t) + 7} text-anchor="end" class="fill-zinc-500 text-[20px]">{shortRp(t)}</text>
		{/each}

		<path d={area} class="fill-emerald-600/10" />
		<path d={line} fill="none" class="stroke-emerald-700" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />

		{#each days as d, i (d.day)}
			{#if i % labelEvery === 0 || i === days.length - 1}
				<text x={x(i)} y={H - 8} text-anchor={i === 0 ? "start" : i === days.length - 1 ? "end" : "middle"} class="fill-zinc-500 text-[20px]">{dayLabel(d.day, false)}</text>
			{/if}
		{/each}

		<!-- titik terpilih -->
		<line x1={x(sel)} x2={x(sel)} y1={pad.t} y2={H - pad.b} class="stroke-emerald-700/30" />
		<circle cx={x(sel)} cy={y(values[sel])} r="6" class="fill-white stroke-emerald-700" stroke-width="3" />

		<!-- area sentuh per hari -->
		{#each days as d, i (d.day)}
			<rect
				x={x(i) - (W - pad.l - pad.r) / Math.max(days.length - 1, 1) / 2}
				y={pad.t}
				width={(W - pad.l - pad.r) / Math.max(days.length - 1, 1)}
				height={H - pad.t - pad.b}
				fill="transparent"
				role="button"
				tabindex="-1"
				aria-label="{dayLabel(d.day)}: {rp(d[metric])}"
				onpointerdown={() => (picked = i)}
				onpointerenter={(e) => e.pointerType === 'mouse' && (picked = i)}
			/>
		{/each}
	</svg>
{/if}
