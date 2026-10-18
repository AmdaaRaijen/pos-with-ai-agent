<script lang="ts">
	import type { Snippet } from 'svelte';
	import X from 'phosphor-svelte/lib/X';

	let {
		open = $bindable(false),
		title,
		children
	}: { open: boolean; title: string; children: Snippet } = $props();

	let el: HTMLDialogElement;

	$effect(() => {
		if (open && !el.open) el.showModal();
		else if (!open && el.open) el.close();
	});
</script>

<dialog
	bind:this={el}
	class="sheet fixed inset-x-0 top-auto bottom-0 m-0 mx-auto max-h-[90dvh] w-full max-w-xl overflow-y-auto overscroll-contain rounded-t-[2rem] bg-white p-0 text-zinc-900 shadow-bar"
	onclose={() => (open = false)}
	onclick={(e) => e.target === el && (open = false)}
>
	<div class="px-5 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
		<div class="mb-5 flex items-center justify-between gap-3">
			<h2 class="text-xl font-semibold tracking-tight">{title}</h2>
			<button class="press grid size-11 place-items-center rounded-full bg-zinc-100" onclick={() => (open = false)} aria-label="Tutup">
				<X size={20} weight="bold" />
			</button>
		</div>
		{@render children()}
	</div>
</dialog>
