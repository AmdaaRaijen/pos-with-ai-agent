<script lang="ts">
	let { active }: { active: 'baru' | 'riwayat' } = $props();
</script>

<div class="grid grid-cols-2 gap-1 rounded-2xl bg-zinc-200/60 p-1 text-sm font-semibold" role="tablist">
	<a href="/" role="tab" aria-selected={active === 'baru'} class="press rounded-xl py-2.5 text-center {active === 'baru' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'}">Jual</a>
	<a href="/riwayat" role="tab" aria-selected={active === 'riwayat'} class="press rounded-xl py-2.5 text-center {active === 'riwayat' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'}">Riwayat</a>
</div>
