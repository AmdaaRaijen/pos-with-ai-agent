import { fail, redirect } from '@sveltejs/kit';
import { aiConfig, DEFAULT_AI_BASE_URL, DEFAULT_AI_MODEL } from '#lib/server/assistant.ts';
import { COOKIE, hashPassword, verifyPassword } from '#lib/server/auth.ts';
import { db, must } from '#lib/server/db.ts';
import { getEmoneyConfig, getStoreName, getWhitelist, setSetting } from '#lib/server/data.ts';
import { botInfo, connectWebhook, telegramReady, webhookInfo } from '#lib/server/telegram.ts';
import { publicOrigin } from '#lib/server/origin.ts';
import { normalizePhone } from '#lib/money.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, request }) => {
	const [store, emoney, whitelist, links] = await Promise.all([
		getStoreName(),
		getEmoneyConfig(),
		getWhitelist(),
		(async () => must(await db().from('telegram_links').select('phone, name')) as { phone: string; name: string | null }[])()
	]);
	const [bot, hook, ai] = await Promise.all([botInfo(), webhookInfo(), aiConfig()]);
	return {
		store,
		emoney,
		whitelist,
		linked: links,
		ai: { ...ai, defaultBaseUrl: DEFAULT_AI_BASE_URL, defaultModel: DEFAULT_AI_MODEL },
		telegram: {
			configured: telegramReady(),
			username: bot?.username ?? null,
			connected: !!hook?.url,
			error: hook?.last_error_message ?? null,
			origin: publicOrigin(request, url)
		}
	};
};

const money = (v: FormDataEntryValue | null) => Math.max(0, Math.round(Number(v) || 0));

export const actions: Actions = {
	store: async ({ request }) => {
		const name = String((await request.formData()).get('name') ?? '').trim().slice(0, 60);
		if (!name) return fail(400, { section: 'store', error: 'Nama toko harus diisi.' });
		await setSetting('store', { name });
		return { section: 'store', ok: 'Nama toko tersimpan.' };
	},

	emoney: async ({ request }) => {
		const f = await request.formData();
		const cfg = { block: money(f.get('block')), profit: money(f.get('profit')), admin: money(f.get('admin')) };
		if (cfg.block < 1000) return fail(400, { section: 'emoney', error: 'Kelipatan minimal Rp 1.000.' });
		await setSetting('emoney', cfg);
		return { section: 'emoney', ok: 'Aturan saldo tersimpan. Berlaku untuk transaksi berikutnya.' };
	},

	ai: async ({ request }) => {
		const f = await request.formData();
		const base_url = String(f.get('base_url') ?? '').trim().replace(/\/+$/, '');
		const model = String(f.get('model') ?? '').trim();
		if (base_url && !/^https:\/\/[^\s]+$/.test(base_url)) return fail(400, { section: 'ai', error: 'Alamat API harus diawali https://' });
		if (model.length > 100) return fail(400, { section: 'ai', error: 'Nama model terlalu panjang.' });
		await setSetting('ai', { base_url, model });
		return { section: 'ai', ok: 'Pengaturan AI tersimpan.' };
	},

	addPhone: async ({ request }) => {
		const phone = normalizePhone(String((await request.formData()).get('phone') ?? ''));
		if (!/^62\d{8,13}$/.test(phone)) return fail(400, { section: 'tg', error: 'Nomor HP tidak valid. Contoh: 0812 3456 7890' });
		const list = await getWhitelist();
		if (!list.map(normalizePhone).includes(phone)) await setSetting('telegram_whitelist', [...list, phone]);
		return { section: 'tg', ok: 'Nomor ditambahkan.' };
	},

	removePhone: async ({ request }) => {
		const phone = normalizePhone(String((await request.formData()).get('phone') ?? ''));
		await setSetting('telegram_whitelist', (await getWhitelist()).filter((p) => normalizePhone(p) !== phone));
		must(await db().from('telegram_links').delete().eq('phone', phone));
		return { section: 'tg', ok: 'Nomor dihapus.' };
	},

	connect: async ({ url, request }) => {
		const origin = publicOrigin(request, url);
		if (!telegramReady()) return fail(400, { section: 'tg', error: 'TELEGRAM_BOT_TOKEN dan TELEGRAM_WEBHOOK_SECRET belum diisi di .env.' });
		if (!origin.startsWith('https://')) {
			return fail(400, { section: 'tg', error: 'Telegram butuh alamat https. Jalankan dari alamat online (bukan localhost).' });
		}
		try {
			await connectWebhook(origin);
		} catch (e) {
			return fail(400, { section: 'tg', error: e instanceof Error ? e.message : 'Gagal menyambung.' });
		}
		return { section: 'tg', ok: 'Telegram tersambung.' };
	},

	password: async ({ request, locals }) => {
		const f = await request.formData();
		const current = String(f.get('current') ?? '');
		const next = String(f.get('next') ?? '');
		const user = must(await db().from('app_users').select('password_hash').eq('id', locals.userId!).single()) as { password_hash: string };
		if (!verifyPassword(current, user.password_hash)) return fail(400, { section: 'pw', error: 'Kata sandi lama salah.' });
		if (next.length < 6) return fail(400, { section: 'pw', error: 'Kata sandi baru minimal 6 karakter.' });
		must(await db().from('app_users').update({ password_hash: hashPassword(next) }).eq('id', locals.userId!));
		return { section: 'pw', ok: 'Kata sandi diganti.' };
	},

	logout: async ({ cookies }) => {
		cookies.delete(COOKIE, { path: '/' });
		redirect(303, '/login');
	}
};
