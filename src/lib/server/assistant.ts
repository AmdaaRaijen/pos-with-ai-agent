import { AI_API_KEY, AI_BASE_URL, AI_MODEL } from '$app/env/private';
import {
	archiveProduct,
	bagAdvice,
	createExpense,
	createProduct,
	createSale,
	deleteExpense,
	deleteSale,
	getEmoneyConfig,
	getExpense,
	dailyStats,
	getSale,
	getStoreName,
	itemStats,
	listExpenses,
	listProducts,
	listSales,
	getSetting,
	stockAdvice,
	summary,
	updateProduct,
	updateSale
} from './data';
import { addDays, dayLabel, emoneyFee, rp, timeLabel, wibDate } from '#lib/money.ts';
import { label, type CartLine, type Product, type Sale } from '#lib/types.ts';

export type Turn = { role: 'user' | 'assistant'; content: string };

const MAX_STEPS = 8;

function systemPrompt(store: string) {
	const today = wibDate();
	return `Kamu adalah asisten toko "${store}" lewat Telegram. Pemilik dan pegawainya kebanyakan ibu-ibu yang tidak terbiasa dengan istilah teknis, dan berjualan keliling membawa tas.

Hari ini ${dayLabel(today)} (${today}), zona waktu WIB.

Cara menjawab:
- Bahasa Indonesia santai, sopan, hangat. Sapa "Ibu" atau "Bu". Kalimat pendek.
- Jangan pakai istilah rumit. Ganti "omzet" dengan "uang masuk", "margin/profit" dengan "untung", "stok" boleh dipakai.
- Tanpa format markdown (jangan pakai tanda bintang, pagar, atau tabel). Daftar cukup dengan tanda "-" di awal baris.
- Uang ditulis seperti "Rp 12.500". Jangan pakai emoji.
- Jawab seperlunya. Jangan menumpuk banyak angka. Maksimal sekitar 8 baris kecuali diminta rinci.
- Kalau ada yang kurang jelas (misal jumlah atau barang), tanya satu hal saja dengan singkat.

Aturan kerja:
- Semua angka (stok, harga, untung, penjualan) HARUS dari tool. Jangan menebak atau mengarang.
- Setelah mencatat atau mengubah sesuatu, ulangi hasil singkatnya supaya Ibu yakin sudah benar.
- Semua tool yang mengubah data (tambah/ubah/hapus barang, catat/ubah/hapus penjualan, catat/hapus pengeluaran) TIDAK langsung dilaksanakan. Tool hanya menyiapkan rencana, lalu sistem meminta persetujuan Ibu. Setelah memanggil tool itu, sampaikan ringkasannya dengan bahasa sederhana dan tanyakan "Lanjut, Bu?". JANGAN bilang sudah selesai sebelum Ibu menjawab ya.
- Kalau Ibu sudah jelas meminta sesuatu, langsung panggil tool-nya (jangan bertanya dua kali). Kalau ada yang kurang jelas, tanya dulu.
- Menjual saldo e-money: pakai nama e-money (misal DANA), nominal saldonya, dan uang yang dibayar pembeli (parameter dibayar). Kalau uang yang dibayar belum disebut, tanyakan dulu, jangan menebak. Biaya admin tetap per transaksi, untung dihitung sistem dari selisih uang dibayar dikurangi saldo dan admin.
- Barang bisa punya varian, misalnya "Kopi - Es" dan "Kopi - Hangat" dengan harga berbeda. Kalau Ibu hanya menyebut "kopi" padahal ada beberapa varian, tanyakan varian yang mana. Isi parameter varian kalau Ibu menyebutnya.
- Kalau Ibu menyebut "tadi", "kemarin", dll, ubah jadi tanggal yang benar.
- Untuk saran belanja: jelaskan alasan sederhana (misal "laku sekitar 5 per hari, sisa 2, jadi cukup 0,4 hari") lalu sebut jumlah yang disarankan dibeli.
- Untuk saran isi tas: sebut barang yang paling laku dan paling untung, dan berapa sebaiknya dibawa. Barang yang untungnya besar dan laku boleh diperbanyak.
- Pengeluaran lain-lain (biaya keamanan, listrik, dan sejenisnya) dicatat dengan tool catat_pengeluaran. Pengeluaran mengurangi untung bersih. Belanja barang dagangan BUKAN pengeluaran lain-lain, itu lewat stok.
- Barang pendukung seperti sedotan, cup, es batu punya harga jual 0: tidak dihitung sebagai pemasukan, hanya biaya. Harga jual 0 DIPERBOLEHKAN. Kalau Ibu bilang barang itu tidak dijual atau harga jualnya 0, isi tidak_dijual = true. Jangan menolak dan jangan mengganti harga jualnya sendiri.
- Kamu hanya mengurus toko ini. Kalau diminta hal lain, tolak dengan ramah.`;
}

/* ---------- Tools ---------- */

const str = { type: 'string' } as const;
const num = { type: 'number' } as const;

type ToolDef = { name: string; description: string; parameters: Record<string, unknown> };

const lineItem = {
	type: 'object',
	properties: { nama: str, varian: { ...str, description: 'Varian barang, misal Es atau Hangat. Kosongkan kalau tidak ada.' }, jumlah: num, nominal: num, dibayar: { ...num, description: 'Khusus e-money: total uang yang dibayar pembeli (saldo ditambah biaya).' } },
	required: ['nama']
};

const tools: ToolDef[] = [
	{
		name: 'lihat_stok',
		description: 'Daftar semua barang beserta varian, harga beli, harga jual, untung per barang, dan sisa stok. Saldo e-money ikut ditampilkan.',
		parameters: { type: 'object', properties: {} }
	},
	{
		name: 'tambah_barang',
		description: 'Tambah barang baru. Isi harga_jual ATAU untung (untung per barang). Barang pendukung yang tidak dijual (sedotan, cup, es batu) dibuat dengan tidak_dijual = true (harga jual 0); itu DIPERBOLEHKAN dan tidak dihitung sebagai pemasukan. harga_beli adalah harga per satuan. Untuk saldo e-money, isi jenis "emoney" dan cukup nama. Barang yang sama dengan harga beda (Es/Hangat) dibuat terpisah dengan varian berbeda.',
		parameters: {
			type: 'object',
			properties: { nama: str, varian: str, jenis: { type: 'string', enum: ['barang', 'emoney'] }, harga_beli: num, harga_jual: num, untung: num, stok: num, tidak_dijual: { type: 'boolean', description: 'true untuk barang pendukung yang tidak dijual (es batu, cup, sedotan). Harga jualnya 0.' } },
			required: ['nama']
		}
	},
	{
		name: 'ubah_barang',
		description: 'Ubah barang yang sudah ada (nama + varian untuk menunjuk barangnya). tambah_stok menambah ke stok sekarang (boleh negatif), stok mengganti angka stok. nama_baru dan varian_baru untuk mengganti nama/varian.',
		parameters: {
			type: 'object',
			properties: { nama: str, varian: str, nama_baru: str, varian_baru: str, harga_beli: num, harga_jual: num, untung: num, stok: num, tambah_stok: num, tidak_dijual: { type: 'boolean', description: 'true untuk menjadikannya barang pendukung (harga jual 0).' } },
			required: ['nama']
		}
	},
	{
		name: 'hapus_barang',
		description: 'Hapus barang dari daftar. Riwayat penjualan tetap aman. Minta konfirmasi dulu sebelum memanggil.',
		parameters: { type: 'object', properties: { nama: str, varian: str }, required: ['nama'] }
	},
	{
		name: 'catat_penjualan',
		description: 'Catat penjualan baru dan kurangi stok. Tiap item: nama barang, varian (kalau ada), dan jumlah. Untuk saldo e-money isi nama e-money, nominal, dan dibayar (jumlah diabaikan).',
		parameters: { type: 'object', properties: { items: { type: 'array', items: lineItem }, catatan: str }, required: ['items'] }
	},
	{
		name: 'lihat_penjualan',
		description: 'Daftar penjualan pada rentang tanggal (YYYY-MM-DD, WIB). Kosongkan untuk hari ini. Mengembalikan id penjualan.',
		parameters: { type: 'object', properties: { dari: str, sampai: str } }
	},
	{
		name: 'ubah_penjualan',
		description: 'Ganti isi penjualan yang sudah dicatat (butuh id dari lihat_penjualan). items menggantikan seluruh isi lama, jadi sertakan semua barangnya. Stok dihitung ulang.',
		parameters: { type: 'object', properties: { id: str, items: { type: 'array', items: lineItem }, catatan: str }, required: ['id', 'items'] }
	},
	{
		name: 'catat_pengeluaran',
		description: 'Catat pengeluaran lain-lain di luar belanja barang (biaya keamanan, listrik, kebersihan). Tanggal YYYY-MM-DD, kosongkan untuk hari ini.',
		parameters: { type: 'object', properties: { nama: str, jumlah: num, tanggal: str }, required: ['nama', 'jumlah'] }
	},
	{
		name: 'lihat_pengeluaran',
		description: 'Daftar pengeluaran lain-lain pada rentang tanggal (YYYY-MM-DD). Kosongkan untuk 7 hari terakhir. Mengembalikan id.',
		parameters: { type: 'object', properties: { dari: str, sampai: str } }
	},
	{
		name: 'hapus_pengeluaran',
		description: 'Hapus satu catatan pengeluaran (id dari lihat_pengeluaran). Minta konfirmasi dulu.',
		parameters: { type: 'object', properties: { id: str }, required: ['id'] }
	},
	{
		name: 'hapus_penjualan',
		description: 'Hapus satu penjualan (id dari lihat_penjualan). Stok barangnya dikembalikan.',
		parameters: { type: 'object', properties: { id: str }, required: ['id'] }
	},
	{
		name: 'laporan_untung',
		description: 'Ringkasan uang masuk, untung, jumlah transaksi, dan barang paling untung pada rentang tanggal. Kosongkan untuk hari ini.',
		parameters: { type: 'object', properties: { dari: str, sampai: str } }
	},
	{
		name: 'tren_harian',
		description: 'Uang masuk dan untung per hari untuk beberapa hari terakhir (default 7, maksimal 31).',
		parameters: { type: 'object', properties: { hari: num } }
	},
	{
		name: 'saran_belanja',
		description: 'Barang yang perlu dibeli lagi, lengkap dengan alasan (laku per hari, sisa stok, cukup berapa hari) dan jumlah yang disarankan.',
		parameters: { type: 'object', properties: {} }
	},
	{
		name: 'saran_isi_tas',
		description: 'Barang yang sebaiknya diperbanyak di tas saat berjualan, urut dari yang paling untung, dengan jumlah yang disarankan dibawa.',
		parameters: { type: 'object', properties: {} }
	}
];

type Args = Record<string, any>;

const norm = (v: unknown) => String(v ?? '').toLowerCase().replace(/\s+/g, ' ').trim();

/** Cari barang dari nama (dan varian). Menerima juga "kopi es" tanpa parameter varian. */
async function resolve(nama: unknown, varian?: unknown): Promise<Product> {
	const all = await listProducts();
	const q = norm([nama, varian].filter(Boolean).join(' '));
	const exact = all.filter((p) => norm(label(p)) === q || (!varian && !p.variant && norm(p.name) === q));
	if (exact.length === 1) return exact[0];

	const tokens = q.replace(/ - /g, ' ').split(' ').filter(Boolean);
	const hay = (p: Product) => norm(`${p.name} ${p.variant ?? ''}`);
	let part = all.filter((p) => tokens.every((t) => hay(p).includes(t)));
	if (!part.length) part = all.filter((p) => q.includes(norm(p.name)));
	if (part.length === 1) return part[0];
	if (part.length > 1) {
		const sameName = part.every((p) => norm(p.name) === norm(part[0].name));
		throw new Error(
			sameName
				? `${part[0].name} punya varian: ${part.map((p) => p.variant ?? 'biasa').join(', ')}. Tanyakan varian yang mana.`
				: `Ada beberapa barang mirip: ${part.map(label).join(', ')}. Tanyakan yang mana.`
		);
	}
	throw new Error(`Barang "${[nama, varian].filter(Boolean).join(' ')}" tidak ada di daftar.`);
}

const int = (v: unknown) => Math.max(0, Math.round(Number(v) || 0));

async function toLines(items: Args[]): Promise<CartLine[]> {
	if (!Array.isArray(items) || !items.length) throw new Error('Isi penjualan kosong.');
	const lines: CartLine[] = [];
	for (const it of items) {
		const p = await resolve(it.nama, it.varian);
		if (p.kind === 'emoney') {
			if (!(Number(it.nominal) > 0)) throw new Error(`Nominal saldo ${p.name} belum disebut.`);
			if (int(it.dibayar) < int(it.nominal)) throw new Error(`Uang yang dibayar pembeli untuk ${p.name} belum disebut. Tanyakan dulu.`);
			lines.push({ product_id: p.id, qty: 1, nominal: int(it.nominal), paid: int(it.dibayar) });
		} else {
			const qty = int(it.jumlah ?? 1) || 1;
			lines.push({ product_id: p.id, qty });
		}
	}
	return lines;
}

function describeSale(s: Sale) {
	const customerPays = s.total + s.sale_items.reduce((a, i) => a + (i.nominal ?? 0), 0);
	return {
		id: s.id,
		jam: timeLabel(s.created_at),
		tanggal: wibDate(new Date(s.created_at)),
		isi: s.sale_items.map((i) =>
			i.kind === 'emoney'
				? { nama: i.name, saldo: i.nominal, biaya: rp(i.unit_price) }
				: { nama: i.name, jumlah: i.qty, harga_satuan: rp(i.unit_price) }
		),
		uang_masuk_toko: rp(s.total),
		pelanggan_bayar: rp(customerPays),
		untung: rp(s.profit),
		catatan: s.note
	};
}

function range(a: Args) {
	const today = wibDate();
	const ok = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);
	const d = ok(a.dari);
	const s = ok(a.sampai);
	const dari = d ?? s ?? today;
	const sampai = s ?? dari;
	return sampai >= dari ? { dari, sampai } : { dari: sampai, sampai: dari };
}

/**
 * Tentukan harga jual dari permintaan. Rp 0 (atau tidak_dijual) = barang pendukung seperti es batu,
 * cup, sedotan: tidak dihitung sebagai pemasukan, hanya biaya.
 */
function sellPrice(beli: number, a: Args, current?: number): number {
	if (a.tidak_dijual === true || a.tidak_dijual === 'true') return 0;
	let jual: number;
	if (a.harga_jual !== undefined && a.harga_jual !== null) jual = Math.round(Number(a.harga_jual) || 0);
	else if (a.untung !== undefined && a.untung !== null) jual = beli + Math.round(Number(a.untung) || 0);
	else jual = current ?? beli;
	if (jual <= 0) return 0;
	if (jual < beli) {
		throw new Error(
			`Harga jual ${rp(jual)} lebih kecil dari harga beli ${rp(beli)}. Kalau barang ini tidak dijual (barang pendukung seperti es batu, cup, sedotan), isi tidak_dijual = true atau harga_jual = 0.`
		);
	}
	return jual;
}

/** Hitung perubahan barang dari permintaan, sekaligus memeriksanya. */
function buildPatch(p: Product, a: Args) {
	const patch: Parameters<typeof updateProduct>[1] = {};
	if (a.nama_baru) patch.name = String(a.nama_baru);
	if (a.varian_baru !== undefined) patch.variant = a.varian_baru ? String(a.varian_baru) : null;
	if (p.kind === 'barang') {
		const beli = a.harga_beli !== undefined ? int(a.harga_beli) : p.buy_price;
		patch.buy_price = beli;
		patch.sell_price = sellPrice(beli, a, p.sell_price);
		if (a.stok !== undefined) patch.stock = int(a.stok);
		else if (a.tambah_stok !== undefined) patch.stock = Math.max(0, p.stock + Math.round(Number(a.tambah_stok) || 0));
	}
	return patch;
}

const run: Record<string, (a: Args) => Promise<unknown>> = {
	async lihat_stok() {
		const list = await listProducts();
		if (!list.length) return 'Belum ada barang sama sekali.';
		return list.map((p) =>
			p.kind === 'emoney'
				? { nama: p.name, jenis: 'saldo e-money' }
				: { nama: p.name, varian: p.variant, beli: p.buy_price, jual: p.sell_price, untung_per_barang: p.sell_price - p.buy_price, stok: p.stock }
		);
	},

	async tambah_barang(a) {
		const nama = String(a.nama ?? '').trim();
		if (!nama) throw new Error('Nama barang kosong.');
		if (a.jenis === 'emoney') {
			const p = await createProduct({ name: nama, kind: 'emoney' });
			return `Saldo ${p.name} sudah ditambahkan. Harga jual dihitung otomatis.`;
		}
		const beli = int(a.harga_beli);
		const jual = sellPrice(beli, a);
		const p = await createProduct({ name: nama, variant: a.varian ? String(a.varian) : null, buy_price: beli, sell_price: jual, stock: int(a.stok) });
		return { ditambah: label(p), beli: p.buy_price, jual: p.sell_price, untung_per_barang: p.sell_price - p.buy_price, stok: p.stock };
	},

	async ubah_barang(a) {
		const p = await resolve(a.nama, a.varian);
		const u = await updateProduct(p.id, buildPatch(p, a));
		return { nama: label(u), beli: u.buy_price, jual: u.sell_price, untung_per_barang: u.sell_price - u.buy_price, stok: u.stock };
	},

	async hapus_barang(a) {
		const p = await resolve(a.nama, a.varian);
		await archiveProduct(p.id);
		return `${label(p)} sudah dihapus dari daftar.`;
	},

	async catat_penjualan(a) {
		const id = await createSale(await toLines(a.items), a.catatan ? String(a.catatan).slice(0, 200) : null, 'telegram');
		return describeSale((await getSale(id))!);
	},

	async lihat_penjualan(a) {
		const r = range(a);
		const sales = await listSales(r.dari, r.sampai, 30);
		return sales.length ? sales.map(describeSale) : 'Belum ada penjualan pada tanggal itu.';
	},

	async ubah_penjualan(a) {
		const id = String(a.id ?? '');
		if (!(await getSale(id))) throw new Error('Penjualan tidak ditemukan.');
		await updateSale(id, await toLines(a.items), a.catatan ? String(a.catatan).slice(0, 200) : null);
		return describeSale((await getSale(id))!);
	},

	async hapus_penjualan(a) {
		const id = String(a.id ?? '');
		if (!(await getSale(id))) throw new Error('Penjualan tidak ditemukan.');
		await deleteSale(id);
		return 'Penjualan dihapus dan stok barangnya dikembalikan.';
	},

	async catat_pengeluaran(a) {
		const nama = String(a.nama ?? '').trim().slice(0, 80);
		const jumlah = int(a.jumlah);
		if (!nama) throw new Error('Untuk apa pengeluarannya belum disebut.');
		if (jumlah <= 0) throw new Error('Jumlah pengeluaran belum jelas.');
		const tgl = typeof a.tanggal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(a.tanggal) && a.tanggal <= wibDate() ? a.tanggal : undefined;
		const e = await createExpense(nama, jumlah, tgl, 'telegram');
		return { dicatat: e.name, jumlah: rp(e.amount), tanggal: e.spent_on };
	},

	async lihat_pengeluaran(a) {
		const today = wibDate();
		const r = a.dari || a.sampai ? range(a) : { dari: addDays(today, -6), sampai: today };
		const list = await listExpenses(r.dari, r.sampai);
		if (!list.length) return 'Tidak ada pengeluaran lain-lain pada tanggal itu.';
		return {
			total: rp(list.reduce((x, e) => x + e.amount, 0)),
			daftar: list.map((e) => ({ id: e.id, tanggal: e.spent_on, untuk: e.name, jumlah: rp(e.amount) }))
		};
	},

	async hapus_pengeluaran(a) {
		await deleteExpense(String(a.id ?? ''));
		return 'Catatan pengeluaran sudah dihapus.';
	},

	async laporan_untung(a) {
		const r = range(a);
		const [sum, items] = await Promise.all([summary(r.dari, r.sampai), itemStats(r.dari, r.sampai)]);
		return {
			dari: r.dari,
			sampai: r.sampai,
			uang_masuk: rp(sum.total),
			untung_jualan: rp(sum.profit),
			pengeluaran_lain: rp(sum.expense),
			untung_bersih: rp(sum.net),
			jumlah_transaksi: sum.trx,
			paling_untung: items.slice(0, 5).map((i) => ({ nama: i.name, terjual: i.qty, untung: rp(i.profit) }))
		};
	},

	async tren_harian(a) {
		const n = Math.min(31, Math.max(1, int(a.hari) || 7));
		const today = wibDate();
		const days = await dailyStats(addDays(today, -(n - 1)), today);
		return days.map((d) => ({ hari: dayLabel(d.day), uang_masuk: rp(d.total), untung_jualan: rp(d.profit), pengeluaran_lain: rp(d.expense), untung_bersih: rp(d.profit - d.expense), transaksi: d.trx }));
	},

	async saran_belanja() {
		const list = await stockAdvice();
		if (!list.length) return 'Belum cukup data penjualan untuk memberi saran.';
		return list.slice(0, 10).map((x) => ({
			nama: x.name,
			sisa_stok: x.stock,
			laku_per_hari: x.sold_per_day,
			cukup_berapa_hari: x.days_left,
			saran_beli: x.buy_qty,
			untung_per_barang: x.profit_each
		}));
	},

	async saran_isi_tas() {
		const list = await bagAdvice();
		if (!list.length) return 'Belum cukup data penjualan untuk memberi saran.';
		return list.slice(0, 10).map((x) => ({
			nama: x.name,
			laku_per_hari: x.sold_per_day,
			untung_per_hari: rp(x.profit_per_day),
			stok_di_rumah: x.stock,
			saran_bawa: x.bring_qty
		}));
	}
};

/* ---------- Rencana: ringkasan yang harus disetujui sebelum data diubah ---------- */

const WRITE = new Set([
	'tambah_barang', 'ubah_barang', 'hapus_barang',
	'catat_penjualan', 'ubah_penjualan', 'hapus_penjualan',
	'catat_pengeluaran', 'hapus_pengeluaran'
]);

export type PendingAction = { tool: string; args: Args; summary: string };
export type Pending = { at: number; actions: PendingAction[] };

async function describeLines(items: Args[], checkStock = true) {
	if (!Array.isArray(items) || !items.length) throw new Error('Isi penjualan kosong.');
	const cfg = await getEmoneyConfig();
	const parts: string[] = [];
	let total = 0;
	let pass = 0;
	for (const it of items) {
		const p = await resolve(it.nama, it.varian);
		if (p.kind === 'emoney') {
			const n = int(it.nominal);
			if (n <= 0) throw new Error(`Nominal saldo ${p.name} belum disebut.`);
			const paid = int(it.dibayar);
			if (paid < n) throw new Error(`Uang yang dibayar pembeli untuk ${p.name} belum disebut. Tanyakan dulu.`);
			const fee = emoneyFee(n, paid, cfg).fee;
			parts.push(`${p.name} saldo ${rp(n)} (biaya ${rp(fee)}, untung ${rp(fee - cfg.admin)})`);
			total += fee;
			pass += n;
		} else {
			const qty = int(it.jumlah ?? 1) || 1;
			if (checkStock && p.stock < qty) throw new Error(`Stok ${label(p)} tinggal ${p.stock}.`);
			parts.push(`${label(p)} x${qty} (${rp(p.sell_price * qty)})`);
			total += p.sell_price * qty;
		}
	}
	return { text: parts.join(', '), total, pay: total + pass };
}

const saleText = (s: Sale) =>
	`${s.sale_items.map((i) => (i.kind === 'emoney' ? `${i.name} saldo ${rp(i.nominal ?? 0)}` : `${i.name} x${i.qty}`)).join(', ')} (${wibDate(new Date(s.created_at))} jam ${timeLabel(s.created_at)}, total ${rp(s.total)})`;

const plan: Record<string, (a: Args) => Promise<string>> = {
	async tambah_barang(a) {
		const nama = String(a.nama ?? '').trim();
		if (!nama) throw new Error('Nama barang kosong.');
		const nama2 = label({ name: nama, variant: a.varian ? String(a.varian) : null });
		const ada = (await listProducts()).some((p) => norm(p.name) === norm(nama) && norm(p.variant) === norm(a.varian));
		if (ada) throw new Error(`${nama2} sudah ada. Pakai ubah barang kalau mau mengganti.`);
		if (a.jenis === 'emoney') return `Tambah saldo e-money ${nama}. Harga jual dihitung otomatis.`;
		const beli = int(a.harga_beli);
		const jual = sellPrice(beli, a);
		return `Tambah barang ${nama2}: beli ${rp(beli)}, ${jual === 0 ? 'tidak dijual (pendukung)' : `jual ${rp(jual)}, untung ${rp(jual - beli)}`}, stok ${int(a.stok)}.`;
	},

	async ubah_barang(a) {
		const p = await resolve(a.nama, a.varian);
		const patch = buildPatch(p, a);
		const ch: string[] = [];
		if (patch.name && patch.name !== p.name) ch.push(`nama jadi ${patch.name}`);
		if (patch.variant !== undefined && (patch.variant ?? '') !== (p.variant ?? '')) ch.push(`varian jadi ${patch.variant ?? 'kosong'}`);
		if (patch.buy_price !== undefined && patch.buy_price !== p.buy_price) ch.push(`harga beli ${rp(p.buy_price)} jadi ${rp(patch.buy_price)}`);
		if (patch.sell_price !== undefined && patch.sell_price !== p.sell_price) ch.push(`harga jual ${rp(p.sell_price)} jadi ${rp(patch.sell_price)}`);
		if (patch.stock !== undefined && patch.stock !== p.stock) ch.push(`stok ${p.stock} jadi ${patch.stock}`);
		if (!ch.length) throw new Error('Tidak ada yang berubah.');
		return `Ubah ${label(p)}: ${ch.join(', ')}.`;
	},

	async hapus_barang(a) {
		const p = await resolve(a.nama, a.varian);
		return `Hapus ${label(p)} dari daftar barang. Riwayat penjualan tetap aman.`;
	},

	async catat_penjualan(a) {
		const d = await describeLines(a.items);
		return `Catat penjualan: ${d.text}. Total toko ${rp(d.total)}${d.pay !== d.total ? `, pelanggan bayar ${rp(d.pay)}` : ''}.`;
	},

	async ubah_penjualan(a) {
		const sale = await getSale(String(a.id ?? ''));
		if (!sale) throw new Error('Penjualan tidak ditemukan.');
		const d = await describeLines(a.items, false);
		return `Ubah penjualan ${saleText(sale)} menjadi: ${d.text}. Total baru ${rp(d.total)}. Stok dihitung ulang.`;
	},

	async hapus_penjualan(a) {
		const sale = await getSale(String(a.id ?? ''));
		if (!sale) throw new Error('Penjualan tidak ditemukan.');
		return `Hapus penjualan ${saleText(sale)}. Stok barangnya dikembalikan.`;
	},

	async catat_pengeluaran(a) {
		const nama = String(a.nama ?? '').trim();
		const jumlah = int(a.jumlah);
		if (!nama) throw new Error('Untuk apa pengeluarannya belum disebut.');
		if (jumlah <= 0) throw new Error('Jumlah pengeluaran belum jelas.');
		return `Catat pengeluaran ${nama} sebesar ${rp(jumlah)}${typeof a.tanggal === 'string' && a.tanggal ? ` tanggal ${a.tanggal}` : ' hari ini'}.`;
	},

	async hapus_pengeluaran(a) {
		const e = await getExpense(String(a.id ?? ''));
		if (!e) throw new Error('Catatan pengeluaran tidak ditemukan.');
		return `Hapus pengeluaran ${e.name} ${rp(e.amount)} (${e.spent_on}).`;
	}
};

/* ---------- Penyedia AI (kompatibel OpenAI) ---------- */

export const DEFAULT_AI_BASE_URL = 'https://ai.sumopod.com/v1';
export const DEFAULT_AI_MODEL = 'deepseek-v4-flash';

/** Alamat dan model bisa diganti di Pengaturan; kunci API hanya dari .env */
export async function aiConfig() {
	const saved = await getSetting<{ base_url?: string; model?: string }>('ai', {});
	return {
		baseUrl: (saved.base_url || AI_BASE_URL || DEFAULT_AI_BASE_URL).replace(/\/+$/, ''),
		model: saved.model || AI_MODEL || DEFAULT_AI_MODEL,
		hasKey: !!AI_API_KEY
	};
}

type ToolCall = { id: string; function: { name: string; arguments: string } };
type ChatMessage = { role: string; content?: string | null; tool_calls?: ToolCall[]; tool_call_id?: string; [k: string]: unknown };

const openAiTools = tools.map((t) => ({ type: 'function', function: { name: t.name, description: t.description, parameters: t.parameters } }));

async function chat(cfg: Awaited<ReturnType<typeof aiConfig>>, messages: ChatMessage[], withTools = true): Promise<ChatMessage> {
	const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
		method: 'POST',
		headers: { 'content-type': 'application/json', authorization: `Bearer ${AI_API_KEY}` },
		body: JSON.stringify({ model: cfg.model, messages, ...(withTools ? { tools: openAiTools, tool_choice: 'auto' } : {}), temperature: 0.3, max_tokens: 1500 }),
		signal: AbortSignal.timeout(45_000)
	});
	if (!res.ok) throw new Error(`AI ${res.status}: ${(await res.text()).slice(0, 300)}`);
	const json = (await res.json()) as { choices?: { message?: ChatMessage }[] };
	const msg = json.choices?.[0]?.message;
	if (!msg) throw new Error('AI tidak mengembalikan jawaban');
	return msg;
}

/* ---------- Loop utama ---------- */

export type AskResult = { reply: string; history: Turn[]; pending: Pending | null };

export async function ask(history: Turn[], text: string): Promise<AskResult> {
	if (!AI_API_KEY) {
		return { reply: 'Asisten belum dihidupkan: AI_API_KEY belum diisi oleh pemilik aplikasi.', history, pending: null };
	}
	const cfg = await aiConfig();
	const messages: ChatMessage[] = [
		{ role: 'system', content: systemPrompt(await getStoreName()) },
		...history.map((t) => ({ role: t.role, content: t.content })),
		{ role: 'user', content: text }
	];
	let reply = '';
	const queued: PendingAction[] = [];

	try {
		for (let step = 0; step < MAX_STEPS; step++) {
			const msg = await chat(cfg, messages);
			const calls = msg.tool_calls ?? [];
			if (!calls.length) {
				// sebagian model menyertakan blok <think>; buang sebelum dikirim ke pengguna
				reply = String(msg.content ?? '').replace(/<think>[\s\S]*?<\/think>/g, '').trim();
				break;
			}

			messages.push(msg); // utuh, termasuk reasoning_content kalau ada
			for (const c of calls) {
				let content: string;
				try {
					const args = JSON.parse(c.function.arguments || '{}') as Args;
					if (WRITE.has(c.function.name)) {
						// Belum mengubah apa pun: simpan rencananya, tunggu jawaban "ya" dari Ibu
						const summary = await plan[c.function.name](args);
						queued.push({ tool: c.function.name, args, summary });
						content = `BELUM DILAKSANAKAN. Menunggu persetujuan Ibu. Sampaikan ringkasan ini lalu tanyakan "Lanjut, Bu?": ${summary}`;
					} else {
						const out = await run[c.function.name]?.(args);
						content = typeof out === 'string' ? out : JSON.stringify(out ?? 'ok');
					}
				} catch (e) {
					content = 'GAGAL: ' + (e instanceof Error ? e.message : 'Terjadi kesalahan.');
				}
				messages.push({ role: 'tool', tool_call_id: c.id, content });
			}
		}
	} catch (e) {
		console.error('assistant error', e);
		return { reply: 'Maaf Bu, saya lagi susah mikir. Coba kirim lagi sebentar lagi ya.', history, pending: null };
	}

	let pending: Pending | null = null;
	if (queued.length) {
		pending = { at: Date.now(), actions: queued };
		reply ||= queued.map((q) => q.summary).join('\n');
		reply += '\n\nBalas "ya" untuk melanjutkan, atau "batal".';
	}
	reply ||= 'Maaf Bu, saya belum paham. Coba tulis dengan cara lain ya.';
	return { reply, pending, history: [...history, { role: 'user' as const, content: text }, { role: 'assistant' as const, content: reply }].slice(-10) };
}

/** Melaksanakan rencana yang sudah disetujui ("ya"), lalu menyampaikan hasilnya. */
export async function runPending(history: Turn[], pending: Pending, text: string): Promise<{ reply: string; history: Turn[] }> {
	const results: string[] = [];
	for (const a of pending.actions) {
		try {
			const out = await run[a.tool](a.args);
			results.push(`${a.summary} -> BERHASIL: ${typeof out === 'string' ? out : JSON.stringify(out)}`);
		} catch (e) {
			results.push(`${a.summary} -> GAGAL: ${e instanceof Error ? e.message : 'terjadi kesalahan'}. Langkah berikutnya tidak dijalankan.`);
			break;
		}
	}

	let reply = '';
	if (AI_API_KEY) {
		try {
			const cfg = await aiConfig();
			const msg = await chat(
				cfg,
				[
					{ role: 'system', content: systemPrompt(await getStoreName()) },
					...history.map((t) => ({ role: t.role, content: t.content })),
					{ role: 'user', content: text },
					{ role: 'user', content: '[Catatan sistem, bukan dari Ibu] Perintah tadi sudah diproses atas persetujuan Ibu. Sampaikan hasilnya singkat dan ramah, apa adanya. Kalau ada yang GAGAL, jelaskan sederhana apa masalahnya.\nHasil:\n' + results.join('\n') }
				],
				false
			);
			reply = String(msg.content ?? '').replace(/<think>[\s\S]*?<\/think>/g, '').trim();
		} catch (e) {
			console.error('assistant confirm error', e);
		}
	}
	reply ||= results.map((r) => (r.includes('BERHASIL') ? 'Sudah, Bu. ' : 'Maaf Bu, gagal. ') + r).join('\n');
	return { reply, history: [...history, { role: 'user' as const, content: text }, { role: 'assistant' as const, content: reply }].slice(-10) };
}
