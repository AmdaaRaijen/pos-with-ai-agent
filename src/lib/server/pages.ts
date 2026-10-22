import { aiConfig, DEFAULT_AI_BASE_URL, DEFAULT_AI_MODEL } from '#lib/server/assistant.ts';
import { db, must } from '#lib/server/db.ts';
import {
	dailyStats,
	getEmoneyConfig,
	getSale,
	getStoreName,
	getWhitelist,
	itemStats,
	listExpenses,
	listProducts,
	listSales,
	stockAdvice,
	summary
} from '#lib/server/data.ts';
import { botInfo, telegramReady, webhookInfo } from '#lib/server/telegram.ts';
import { publicOrigin } from '#lib/server/origin.ts';
import { addDays, periodOf, wibDate } from '#lib/money.ts';

/** Data tiap halaman. Diambil lewat /api/data/[page] supaya pindah halaman tidak menunggu database. */

export async function transaksi() {
	const today = wibDate();
	const [products, emoney, sum] = await Promise.all([listProducts(), getEmoneyConfig(), summary(today, today)]);
	return { products, emoney, today: sum };
}

export async function inventory() {
	const [products, emoney] = await Promise.all([listProducts(), getEmoneyConfig()]);
	return { products, emoney };
}

export async function keuangan(p: string | null) {
	const today = wibDate();
	const period = periodOf(p);
	const from = period === 'bulan' ? today.slice(0, 8) + '01' : addDays(today, period === '30' ? -29 : -6);

	const [days, items, advice, expenses] = await Promise.all([
		dailyStats(from, today),
		itemStats(from, today),
		stockAdvice(),
		listExpenses(from, today)
	]);
	return { period, from, today, days, expenses, items: items.slice(0, 5), advice: advice.filter((a) => a.buy_qty > 0).slice(0, 5) };
}

export async function riwayat() {
	const today = wibDate();
	return { sales: await listSales(addDays(today, -13), today) };
}

/** null kalau transaksinya tidak ada */
export async function sale(id: string) {
	const [s, emoney, products] = await Promise.all([getSale(id), getEmoneyConfig(), listProducts()]);
	return s ? { sale: s, emoney, products } : null;
}

export async function pengaturan(url: URL, request: Request) {
	const [store, emoney, whitelist, links, bot, hook, ai] = await Promise.all([
		getStoreName(),
		getEmoneyConfig(),
		getWhitelist(),
		(async () => must(await db().from('telegram_links').select('phone, name')) as { phone: string; name: string | null }[])(),
		botInfo(),
		webhookInfo(),
		aiConfig()
	]);
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
}
