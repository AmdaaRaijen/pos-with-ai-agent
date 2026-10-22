import { db, must } from './db';
import { addDays, DEFAULT_EMONEY, wibDate, type EmoneyConfig } from '#lib/money.ts';
import { label, type CartLine, type DayStat, type Expense, type ItemStat, type Product, type Sale } from '#lib/types.ts';

/* ---------- Pengaturan ---------- */

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
	const row = must(await db().from('settings').select('value').eq('key', key).maybeSingle()) as { value: T } | null;
	return row?.value ?? fallback;
}

export async function setSetting(key: string, value: unknown) {
	must(await db().from('settings').upsert({ key, value }));
}

export const getEmoneyConfig = async (): Promise<EmoneyConfig> => ({
	...DEFAULT_EMONEY,
	...(await getSetting<Partial<EmoneyConfig>>('emoney', {}))
});
export const getStoreName = async () => (await getSetting('store', { name: 'Toko Saya' })).name;
export const getWhitelist = () => getSetting<string[]>('telegram_whitelist', []);

/* ---------- Barang ---------- */

export async function listProducts(): Promise<Product[]> {
	return must(
		await db().from('products').select('*').eq('active', true).order('kind', { ascending: false }).order('name').order('variant')
	) as Product[];
}

export type ProductInput = { name: string; variant?: string | null; kind?: 'barang' | 'emoney'; buy_price?: number; sell_price?: number; stock?: number };

const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** Varian satu barang (nama sama) berbagi satu stok. */
async function groupOf(name: string): Promise<Product[]> {
	return (await listProducts()).filter((x) => x.kind === 'barang' && sameName(x.name, name));
}

export async function setGroupStock(name: string, stock: number) {
	const ids = (await groupOf(name)).map((x) => x.id);
	if (ids.length) must(await db().from('products').update({ stock }).in('id', ids));
}

export async function createProduct(p: ProductInput): Promise<Product> {
	const kind = p.kind ?? 'barang';
	const siblings = kind === 'barang' ? await groupOf(p.name) : [];
	const created = must(
		await db()
			.from('products')
			.insert({
				name: p.name.trim(),
				variant: p.variant?.trim() || null,
				kind,
				buy_price: p.buy_price ?? 0,
				sell_price: p.sell_price ?? 0,
				stock: p.stock ?? siblings[0]?.stock ?? 0
			})
			.select()
			.single()
	) as Product;
	// stok yang diisi di varian baru berlaku untuk semua varian
	if (siblings.length && p.stock !== undefined && p.stock !== siblings[0].stock) await setGroupStock(created.name, p.stock);
	return created;
}

export async function updateProduct(id: string, p: Partial<ProductInput>): Promise<Product> {
	const patch: Record<string, unknown> = {};
	if (p.name !== undefined) patch.name = p.name.trim();
	if (p.variant !== undefined) patch.variant = p.variant?.trim() || null;
	if (p.buy_price !== undefined) patch.buy_price = p.buy_price;
	if (p.sell_price !== undefined) patch.sell_price = p.sell_price;
	const updated = must(await db().from('products').update(patch).eq('id', id).select().single()) as Product;
	if (p.stock !== undefined && updated.kind === 'barang') {
		await setGroupStock(updated.name, p.stock);
		updated.stock = p.stock;
	}
	return updated;
}

/** Barang tidak benar-benar dihapus supaya riwayat transaksi tetap utuh */
export async function archiveProduct(id: string) {
	must(await db().from('products').update({ active: false }).eq('id', id));
}

/* ---------- Transaksi ---------- */

const SALE_COLS = '*, sale_items(*)';

function dayRange(from: string, to: string) {
	return { gte: `${from}T00:00:00+07:00`, lt: `${addDays(to, 1)}T00:00:00+07:00` };
}

export async function listSales(from: string, to: string, limit = 200): Promise<Sale[]> {
	const r = dayRange(from, to);
	return must(
		await db().from('sales').select(SALE_COLS).gte('created_at', r.gte).lt('created_at', r.lt)
			.order('created_at', { ascending: false }).limit(limit)
	) as Sale[];
}

export async function getSale(id: string): Promise<Sale | null> {
	return must(await db().from('sales').select(SALE_COLS).eq('id', id).maybeSingle()) as Sale | null;
}

/** `at` (ISO) untuk transaksi lama, `stock: false` = rekap: stok tidak berubah */
export async function createSale(
	lines: CartLine[],
	note: string | null,
	source: 'web' | 'telegram' = 'web',
	opts: { at?: string; stock?: boolean } = {}
): Promise<string> {
	return must(
		await db().rpc('create_sale', { p_items: lines, p_note: note, p_source: source, p_stock: opts.stock ?? true, ...(opts.at ? { p_at: opts.at } : {}) })
	) as string;
}

export async function deleteSale(id: string) {
	must(await db().rpc('delete_sale', { p_id: id }));
}

export async function updateSale(id: string, lines: CartLine[], note: string | null) {
	must(await db().rpc('update_sale', { p_id: id, p_items: lines, p_note: note }));
}

/* ---------- Laporan ---------- */

export async function dailyStats(from: string, to: string): Promise<DayStat[]> {
	const rows = must(await db().rpc('daily_stats', { p_from: from, p_to: to })) as DayStat[];
	return rows.map((r) => ({ day: r.day, total: +r.total, profit: +r.profit, trx: +r.trx, expense: +r.expense }));
}

export async function itemStats(from: string, to: string): Promise<ItemStat[]> {
	const rows = must(await db().rpc('item_stats', { p_from: from, p_to: to })) as ItemStat[];
	return rows.map((r) => ({ ...r, qty: +r.qty, total: +r.total, profit: +r.profit }));
}

export async function summary(from: string, to: string) {
	const days = await dailyStats(from, to);
	return {
		from,
		to,
		total: days.reduce((a, d) => a + d.total, 0),
		profit: days.reduce((a, d) => a + d.profit, 0), // untung dari jualan
		expense: days.reduce((a, d) => a + d.expense, 0), // pengeluaran lain-lain
		net: days.reduce((a, d) => a + d.profit - d.expense, 0),
		trx: days.reduce((a, d) => a + d.trx, 0)
	};
}

/* ---------- Pengeluaran lain-lain ---------- */

export async function listExpenses(from: string, to: string): Promise<Expense[]> {
	return must(
		await db().from('expenses').select('*').gte('spent_on', from).lte('spent_on', to)
			.order('spent_on', { ascending: false }).order('created_at', { ascending: false }).limit(200)
	) as Expense[];
}

export async function createExpense(name: string, amount: number, spentOn?: string, source: 'web' | 'telegram' = 'web'): Promise<Expense> {
	const row: Record<string, unknown> = { name: name.trim(), amount, source };
	if (spentOn) row.spent_on = spentOn;
	return must(await db().from('expenses').insert(row).select().single()) as Expense;
}

export async function getExpense(id: string): Promise<Expense | null> {
	return must(await db().from('expenses').select('*').eq('id', id).maybeSingle()) as Expense | null;
}

export async function deleteExpense(id: string) {
	must(await db().from('expenses').delete().eq('id', id));
}

/* ---------- Saran ---------- */

export type StockAdvice = {
	name: string;
	stock: number;
	sold_per_day: number;
	days_left: number | null;
	buy_qty: number;
	profit_each: number;
};

/** Saran belanja: berapa yang perlu dibeli supaya cukup untuk `coverDays` hari ke depan. */
export async function stockAdvice(lookbackDays = 14, coverDays = 7): Promise<StockAdvice[]> {
	const today = wibDate();
	const [products, stats] = await Promise.all([listProducts(), itemStats(addDays(today, -(lookbackDays - 1)), today)]);
	const sold = new Map(stats.map((s) => [s.product_id, s.qty]));
	// satu baris per nama barang: semua variannya berbagi stok
	const groups = new Map<string, Product[]>();
	for (const p of products.filter((x) => x.kind === 'barang')) {
		const k = p.name.trim().toLowerCase();
		groups.set(k, [...(groups.get(k) ?? []), p]);
	}
	return [...groups.values()]
		.map((g) => {
			const stock = g[0].stock;
			const perDay = g.reduce((a, p) => a + (sold.get(p.id) ?? 0), 0) / lookbackDays;
			return {
				name: g[0].name,
				stock,
				sold_per_day: Math.round(perDay * 10) / 10,
				days_left: perDay > 0 ? Math.round((stock / perDay) * 10) / 10 : null,
				buy_qty: Math.max(0, Math.ceil(perDay * coverDays - stock)),
				profit_each: Math.round(g.reduce((a, p) => a + (p.sell_price - p.buy_price), 0) / g.length)
			};
		})
		.filter((a) => a.sold_per_day > 0 || a.stock <= 0)
		.sort((a, b) => (a.days_left ?? Infinity) - (b.days_left ?? Infinity));
}

export type BagAdvice = { name: string; sold_per_day: number; profit_per_day: number; stock: number; bring_qty: number };

/** Saran isi tas: barang yang paling laris dan paling untung, dengan jumlah yang sebaiknya dibawa per hari jualan. */
export async function bagAdvice(lookbackDays = 14): Promise<BagAdvice[]> {
	const today = wibDate();
	const [products, stats] = await Promise.all([listProducts(), itemStats(addDays(today, -(lookbackDays - 1)), today)]);
	const stockOf = new Map(products.map((p) => [p.id, p.stock]));
	return stats
		.filter((s) => s.kind === 'barang' && s.product_id && stockOf.has(s.product_id))
		.map((s) => {
			const perDay = s.qty / lookbackDays;
			const stock = stockOf.get(s.product_id!)!;
			return {
				name: s.name,
				sold_per_day: Math.round(perDay * 10) / 10,
				profit_per_day: Math.round(s.profit / lookbackDays),
				stock,
				bring_qty: Math.min(stock, Math.max(1, Math.ceil(perDay * 1.3)))
			};
		})
		.sort((a, b) => b.profit_per_day - a.profit_per_day);
}
