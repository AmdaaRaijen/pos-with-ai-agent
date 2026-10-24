<script lang="ts">
	import { goto } from '$app/navigation';
	import { addDays, dayLabel, isSingle, type SessionConfig } from '#lib/money.ts';

	let { tabs, active, date, max, cfg }: { tabs: { id: string; label: string }[]; active: string; date: string | null; max: string; cfg: SessionConfig } = $props();

	const go = (p: string, d = '') => goto(isSingle(p) && d ? `?p=${p}&d=${d}` : `?p=${p}`, { reset: false });
	const endDate = $derived(date ? (cfg.end <= cfg.start ? addDays(date, 1) : date) : '');
</script>

<div class="grid auto-cols-fr grid-flow-col gap-1 rounded-2xl bg-zinc-200/60 p-1 text-sm font-semibold" role="tablist">
	{#each tabs as t (t.id)}
		<button
			role="tab"
			aria-selected={active === t.id}
			class="press rounded-xl px-1 py-2.5 {active === t.id ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'}"
			onclick={() => go(t.id)}>{t.label}</button
		>
	{/each}
</div>

{#if isSingle(active)}
	<div class="mt-3">
		<label class="label" for="pf-date">{active === 'sesi' ? 'Tanggal mulai sesi' : 'Tanggal'}</label>
		<input class="field" id="pf-date" type="date" {max} value={date ?? ''} onchange={(e) => go(active, e.currentTarget.value)} />
		{#if active === 'sesi'}
			<p class="mt-1 px-1 text-sm text-zinc-500">
				{date ? `${dayLabel(date, false)} ${cfg.start} sampai ${dayLabel(endDate, false)} ${cfg.end}` : '14 hari terakhir per sesi. Pilih tanggal untuk satu sesi saja.'}
			</p>
		{/if}
	</div>
{/if}
