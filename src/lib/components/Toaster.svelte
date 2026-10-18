<script lang="ts">
	import { toasts } from '#lib/toast.svelte.ts';
	import Check from 'phosphor-svelte/lib/Check';
	import Warning from 'phosphor-svelte/lib/Warning';
</script>

<div class="pointer-events-none fixed inset-x-0 top-3 z-50 flex flex-col items-center gap-2 px-4" aria-live="polite">
	{#each toasts as t (t.id)}
		<div
			class="rise pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-medium text-white shadow-lift {t.tone === 'error' ? 'bg-rose-700' : 'bg-zinc-900'}"
		>
			{#if t.tone === 'error'}<Warning size={20} weight="bold" />{:else}<Check size={20} weight="bold" />{/if}
			{t.text}
		</div>
	{/each}
</div>
