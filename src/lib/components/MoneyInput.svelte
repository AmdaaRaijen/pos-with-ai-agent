<script lang="ts">
	let {
		value = $bindable(0),
		id,
		placeholder = '0',
		required = false,
		onchange
	}: { value: number; id?: string; placeholder?: string; required?: boolean; onchange?: (v: number) => void } = $props();

	const fmt = new Intl.NumberFormat('id-ID');
	const text = $derived(value ? fmt.format(value) : '');
</script>

<div class="relative">
	<span class="pointer-events-none absolute inset-y-0 left-4 grid place-items-center text-base text-zinc-400">Rp</span>
	<input
		{id}
		{placeholder}
		{required}
		class="field pl-12"
		inputmode="numeric"
		autocomplete="off"
		value={text}
		oninput={(e) => {
			const n = Number(e.currentTarget.value.replace(/\D/g, '')) || 0;
			value = Math.min(n, 999_999_999);
			e.currentTarget.value = value ? fmt.format(value) : '';
			onchange?.(value);
		}}
	/>
</div>
