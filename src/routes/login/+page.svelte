<script lang="ts">
	import { enhance } from '$app/forms';
	import Storefront from 'phosphor-svelte/lib/Storefront';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let busy = $state(false);
</script>

<main class="flex min-h-[calc(100dvh-4rem)] flex-col justify-center">
	<div class="rise mb-10">
		<div class="mb-6 grid size-14 place-items-center rounded-2xl bg-emerald-700 text-white">
			<Storefront size={30} weight="fill" />
		</div>
		<h1 class="text-3xl font-semibold tracking-tight">
			{data.firstRun ? 'Buat akun pertama' : 'Masuk ke kasir'}
		</h1>
		<p class="mt-2 max-w-[34ch] text-base text-zinc-500">
			{data.firstRun
				? 'Akun ini dipakai untuk masuk ke aplikasi. Catat nama pengguna dan kata sandinya.'
				: 'Masukkan nama pengguna dan kata sandi toko.'}
		</p>
	</div>

	<form
		method="POST"
		class="rise flex flex-col gap-5"
		style="--i:2"
		use:enhance={() => {
			busy = true;
			return async ({ update }) => {
				await update({ reset: false });
				busy = false;
			};
		}}
	>
		<div>
			<label class="label" for="username">Nama pengguna</label>
			<input class="field" id="username" name="username" autocomplete="username" autocapitalize="none" value={form?.username ?? ''} required />
		</div>
		<div>
			<label class="label" for="password">Kata sandi</label>
			<input class="field" id="password" name="password" type="password" autocomplete={data.firstRun ? 'new-password' : 'current-password'} required />
			{#if data.firstRun}<p class="mt-2 text-sm text-zinc-500">Minimal 6 karakter.</p>{/if}
		</div>

		{#if form?.error}
			<p class="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700" role="alert">{form.error}</p>
		{/if}

		<button class="btn-primary" disabled={busy}>{busy ? 'Sebentar...' : data.firstRun ? 'Buat akun dan masuk' : 'Masuk'}</button>
	</form>
</main>
