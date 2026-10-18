<script lang="ts">
	import { page } from '$app/state';
	import Receipt from 'phosphor-svelte/lib/Receipt';
	import Package from 'phosphor-svelte/lib/Package';
	import ChartLineUp from 'phosphor-svelte/lib/ChartLineUp';
	import GearSix from 'phosphor-svelte/lib/GearSix';

	const items = [
		{ href: '/', label: 'Transaksi', icon: Receipt, match: (p: string) => p === '/' || p.startsWith('/riwayat') },
		{ href: '/inventory', label: 'Stok', icon: Package, match: (p: string) => p.startsWith('/inventory') },
		{ href: '/keuangan', label: 'Keuangan', icon: ChartLineUp, match: (p: string) => p.startsWith('/keuangan') },
		{ href: '/pengaturan', label: 'Pengaturan', icon: GearSix, match: (p: string) => p.startsWith('/pengaturan') }
	];
</script>

<nav class="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200/70 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md" aria-label="Menu utama">
	<ul class="mx-auto grid max-w-xl grid-cols-4">
		{#each items as it (it.href)}
			{@const active = it.match(page.url.pathname)}
			<li>
				<a
					href={it.href}
					aria-current={active ? 'page' : undefined}
					class="press flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium {active ? 'text-emerald-700' : 'text-zinc-500'}"
				>
					<span class="grid h-8 w-14 place-items-center rounded-full transition-colors {active ? 'bg-emerald-100' : ''}">
						<it.icon size={24} weight={active ? 'fill' : 'regular'} />
					</span>
					{it.label}
				</a>
			</li>
		{/each}
	</ul>
</nav>
