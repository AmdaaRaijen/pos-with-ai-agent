/** adminMode: 'flat' = biaya admin sekali per transaksi, 'block' = biaya admin dikali jumlah kelipatan */
export type EmoneyConfig = { block: number; profit: number; admin: number; adminMode: 'flat' | 'block' };

export const DEFAULT_EMONEY: EmoneyConfig = { block: 100_000, profit: 3_500, admin: 1_500, adminMode: 'flat' };

const rupiah = new Intl.NumberFormat('id-ID');

/** 12500 -> "Rp 12.500" */
export const rp = (n: number) => (n < 0 ? '-' : '') + 'Rp ' + rupiah.format(Math.abs(Math.round(n)));

/** 100000 -> "100rb", 1500000 -> "1,5 jt" */
export function shortRp(n: number): string {
	const a = Math.abs(n);
	const s = n < 0 ? '-' : '';
	if (a >= 1_000_000) return s + (a / 1_000_000).toFixed(a % 1_000_000 ? 1 : 0).replace('.', ',') + ' jt';
	if (a >= 1_000) return s + (a / 1_000).toFixed(a % 1_000 ? 1 : 0).replace('.', ',') + 'rb';
	return s + a;
}

/**
 * Harga jual saldo e-money. Setiap kelipatan `block` (dibulatkan ke atas) dihitung
 * satu kelipatan untung (`profit`). Biaya admin (`admin`) dikenakan sekali per transaksi (flat),
 * atau per kelipatan kalau adminMode = 'block'.
 * 200.000 -> 2 transaksi -> Rp 10.000, 220.000 -> 3 transaksi -> Rp 15.000.
 */
export function emoneyFee(nominal: number, cfg: EmoneyConfig = DEFAULT_EMONEY) {
	if (!(nominal > 0)) return { blocks: 0, fee: 0, admin: 0, profit: 0, customerPays: 0 };
	const blocks = Math.ceil(nominal / cfg.block);
	const admin = cfg.adminMode === 'block' ? blocks * cfg.admin : cfg.admin;
	const fee = blocks * cfg.profit + admin;
	return {
		blocks,
		fee,
		admin,
		profit: blocks * cfg.profit,
		customerPays: nominal + fee
	};
}

/** Tanggal "YYYY-MM-DD" menurut WIB */
export function wibDate(d: Date = new Date()): string {
	return new Date(d.getTime() + 7 * 3_600_000).toISOString().slice(0, 10);
}

export function addDays(date: string, n: number): string {
	const d = new Date(date + 'T00:00:00Z');
	d.setUTCDate(d.getUTCDate() + n);
	return d.toISOString().slice(0, 10);
}

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export function dayLabel(date: string, withWeekday = true): string {
	const d = new Date(date + 'T00:00:00Z');
	const base = `${d.getUTCDate()} ${BULAN[d.getUTCMonth()]}`;
	return withWeekday ? `${HARI[d.getUTCDay()]}, ${base}` : base;
}

export function timeLabel(iso: string): string {
	return new Date(new Date(iso).getTime() + 7 * 3_600_000).toISOString().slice(11, 16);
}

/** Normalkan nomor HP Indonesia ke format 628xxxx */
export function normalizePhone(raw: string): string {
	let p = raw.replace(/[^\d+]/g, '').replace(/^\+/, '');
	if (p.startsWith('0')) p = '62' + p.slice(1);
	else if (p.startsWith('8')) p = '62' + p;
	return p;
}
