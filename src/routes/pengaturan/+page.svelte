<script lang="ts">
	import { enhance, type SubmitFunction } from '$app/forms';
	import { rp } from '#lib/money.ts';
	import { toast } from '#lib/toast.svelte.ts';
	import MoneyInput from '#lib/components/MoneyInput.svelte';
	import TelegramLogo from 'phosphor-svelte/lib/TelegramLogo';
	import SignOut from 'phosphor-svelte/lib/SignOut';
	import Trash from 'phosphor-svelte/lib/Trash';
	import Check from 'phosphor-svelte/lib/Check';
	import Warning from 'phosphor-svelte/lib/Warning';
	
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// svelte-ignore state_referenced_locally
	let block = $state(data.emoney.block);
	// svelte-ignore state_referenced_locally
	let profit = $state(data.emoney.profit);
	// svelte-ignore state_referenced_locally
	let admin = $state(data.emoney.admin);
	let busy = $state('');

	/** Semua form: tampilkan toast hasil, kosongkan isian kalau berhasil */
	const submit =
		(name: string, reset = false): SubmitFunction =>
		() => {
			busy = name;
			return async ({ result, update }) => {
				busy = '';
				if (result.type === 'success') toast(String(result.data?.ok ?? 'Tersimpan'));
				else if (result.type === 'failure') toast(String(result.data?.error ?? 'Gagal'), 'error');
				else if (result.type === 'error') toast('Gagal. Cek sambungan internet.', 'error');
				await update({ reset });
			};
		};

	const tg = $derived(data.telegram);
</script>

<header class="rise mb-6">
	<h1 class="text-2xl font-semibold tracking-tight">Pengaturan</h1>
</header>

<div class="space-y-8">
	<!-- Toko -->
	<section class="rise" style="--i:1">
		<h2 class="mb-3 px-1 text-base font-semibold">Toko</h2>
		<form method="POST" action="?/store" use:enhance={submit('store')} class="flex flex-col gap-4 rounded-[2rem] border border-zinc-200/70 bg-white p-5 shadow-lift">
			<div>
				<label class="label" for="store">Nama toko</label>
				<input class="field" id="store" name="name" maxlength="60" value={data.store} required />
			</div>
			<button class="btn-primary" disabled={busy === 'store'}>Simpan</button>
		</form>
	</section>

	<!-- Aturan e-money -->
	<section class="rise" style="--i:2">
		<h2 class="mb-1 px-1 text-base font-semibold">Aturan saldo e-money</h2>
		<p class="mb-3 px-1 text-sm text-zinc-500">Tiap kelipatan nominal di bawah dihitung satu transaksi, dibulatkan ke atas.</p>
		<form method="POST" action="?/emoney" use:enhance={submit('emoney')} class="flex flex-col gap-4 rounded-[2rem] border border-zinc-200/70 bg-white p-5 shadow-lift">
			<input type="hidden" name="block" value={block} />
			<input type="hidden" name="profit" value={profit} />
			<input type="hidden" name="admin" value={admin} />
			<div>
				<label class="label" for="block">Kelipatan</label>
				<MoneyInput id="block" bind:value={block} />
			</div>
			<div>
				<label class="label" for="eprofit">Untung per kelipatan</label>
				<MoneyInput id="eprofit" bind:value={profit} />
			</div>
			<div>
				<label class="label" for="eadmin">Biaya admin per kelipatan</label>
				<MoneyInput id="eadmin" bind:value={admin} />
			</div>
			<p class="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
				Pelanggan membayar {rp(profit + admin)} setiap {rp(block)}. Contoh {rp(block * 2)} = {rp((profit + admin) * 2)}, {rp(block * 2 + block / 5)} = {rp((profit + admin) * 3)}.
			</p>
			<button class="btn-primary" disabled={busy === 'emoney'}>Simpan aturan</button>
		</form>
	</section>

	<!-- Telegram -->
	<section class="rise" style="--i:3">
		<h2 class="mb-1 flex items-center gap-2 px-1 text-base font-semibold"><TelegramLogo size={22} weight="fill" class="text-sky-600" /> Asisten Telegram</h2>
		<p class="mb-3 px-1 text-sm text-zinc-500">Hanya nomor HP di daftar ini yang boleh memakai asisten.</p>

		<div class="rounded-[2rem] border border-zinc-200/70 bg-white p-5 shadow-lift">
			<ul class="mb-4 space-y-2 text-sm">
				<li class="flex items-center gap-2">
					{#if tg.configured && tg.username}<Check size={18} weight="bold" class="text-emerald-700" />Bot siap: <span class="font-semibold">@{tg.username}</span>{:else}<Warning size={18} weight="bold" class="text-amber-600" />Token bot belum diisi di .env{/if}
				</li>
				<li class="flex items-center gap-2">
					{#if data.ai.hasKey}<Check size={18} weight="bold" class="text-emerald-700" />Kecerdasan asisten aktif ({data.ai.model}){:else}<Warning size={18} weight="bold" class="text-amber-600" />AI_API_KEY belum diisi di .env{/if}
				</li>
				<li class="flex items-center gap-2">
					{#if tg.connected}<Check size={18} weight="bold" class="text-emerald-700" />Tersambung ke Telegram{:else}<Warning size={18} weight="bold" class="text-amber-600" />Belum disambungkan{/if}
				</li>
				{#if tg.error}<li class="text-rose-700">Telegram melapor: {tg.error}</li>{/if}
			</ul>

			<form method="POST" action="?/connect" use:enhance={submit('connect')}>
				<button class="btn-soft w-full" disabled={busy === 'connect'}>{tg.connected ? 'Sambungkan ulang' : 'Sambungkan ke Telegram'}</button>
			</form>

			<h3 class="mt-6 mb-2 text-sm font-semibold text-zinc-600">Nomor yang diizinkan</h3>
			{#if data.whitelist.length === 0}
				<p class="rounded-2xl bg-zinc-50 px-4 py-4 text-sm text-zinc-500">Belum ada nomor. Tambahkan nomor HP di bawah.</p>
			{:else}
				<ul class="divide-y divide-zinc-100 rounded-2xl border border-zinc-100">
					{#each data.whitelist as phone (phone)}
						{@const joined = data.linked.some((l) => l.phone === phone)}
						<li class="flex items-center justify-between gap-3 px-4 py-3">
							<div>
								<p class="text-base font-semibold">+{phone}</p>
								<p class="text-sm {joined ? 'text-emerald-700' : 'text-zinc-500'}">{joined ? 'Sudah masuk Telegram' : 'Belum membuka bot'}</p>
							</div>
							<form method="POST" action="?/removePhone" use:enhance={submit('rm' + phone)}>
								<input type="hidden" name="phone" value={phone} />
								<button class="press grid size-11 place-items-center rounded-xl bg-rose-50 text-rose-700" aria-label="Hapus +{phone}"><Trash size={20} /></button>
							</form>
						</li>
					{/each}
				</ul>
			{/if}

			<form method="POST" action="?/addPhone" use:enhance={submit('add', true)} class="mt-4 flex flex-col gap-3">
				<div>
					<label class="label" for="phone">Tambah nomor HP</label>
					<input class="field" id="phone" name="phone" type="tel" inputmode="tel" placeholder="0812 3456 7890" required />
				</div>
				<button class="btn-primary" disabled={busy === 'add'}>Tambah nomor</button>
			</form>

			<ol class="mt-6 list-decimal space-y-1 pl-5 text-sm text-zinc-500">
				<li>Tambahkan nomor HP di atas.</li>
				<li>Buka bot{tg.username ? ` @${tg.username}` : ''} di Telegram, tekan Start.</li>
				<li>Tekan tombol "Bagikan nomor HP". Kalau cocok, asisten langsung bisa dipakai.</li>
			</ol>
		</div>
	</section>

	<!-- AI -->
	<section class="rise" style="--i:4">
		<h2 class="mb-1 px-1 text-base font-semibold">Otak asisten (AI)</h2>
		<p class="mb-3 px-1 text-sm text-zinc-500">Bisa memakai penyedia apa saja yang kompatibel dengan OpenAI. Kunci API diisi di berkas .env, bukan di sini.</p>
		<form method="POST" action="?/ai" use:enhance={submit('ai')} class="flex flex-col gap-4 rounded-[2rem] border border-zinc-200/70 bg-white p-5 shadow-lift">
			<div>
				<label class="label" for="base_url">Alamat API</label>
				<input class="field" id="base_url" name="base_url" inputmode="url" autocapitalize="none" placeholder={data.ai.defaultBaseUrl} value={data.ai.baseUrl} />
			</div>
			<div>
				<label class="label" for="model">Model</label>
				<input class="field" id="model" name="model" autocapitalize="none" placeholder={data.ai.defaultModel} value={data.ai.model} />
			</div>
			<button class="btn-soft" disabled={busy === 'ai'}>Simpan</button>
		</form>
	</section>

	<!-- Akun -->
	<section class="rise" style="--i:5">
		<h2 class="mb-3 px-1 text-base font-semibold">Akun</h2>
		<form method="POST" action="?/password" use:enhance={submit('pw', true)} class="flex flex-col gap-4 rounded-[2rem] border border-zinc-200/70 bg-white p-5 shadow-lift">
			<div>
				<label class="label" for="current">Kata sandi lama</label>
				<input class="field" id="current" name="current" type="password" autocomplete="current-password" required />
			</div>
			<div>
				<label class="label" for="next">Kata sandi baru</label>
				<input class="field" id="next" name="next" type="password" autocomplete="new-password" minlength="6" required />
			</div>
			<button class="btn-soft" disabled={busy === 'pw'}>Ganti kata sandi</button>
		</form>

		<form method="POST" action="?/logout" class="mt-4">
			<button class="btn-danger w-full"><SignOut size={20} weight="bold" /> Keluar</button>
		</form>
	</section>
</div>
