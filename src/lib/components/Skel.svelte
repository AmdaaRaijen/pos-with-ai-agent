<script lang="ts">
	let { class: cls = '' }: { class?: string } = $props();
</script>

<div class="animate-pulse rounded-2xl bg-zinc-200/70 motion-reduce:animate-none {cls}" aria-hidden="true"></div>
