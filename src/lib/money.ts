/** admin = biaya admin per transaksi, dipotong dari selisih nominal dan uang yang dibayar pembeli */
export type EmoneyConfig = { admin: number };

export const DEFAULT_EMONEY: EmoneyConfig = { admin: 1_500 };

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

/** Biaya (pembeli bayar dikurangi nominal) dan untung (biaya dikurangi admin) isi saldo */
export function emoneyFee(nominal: number, paid: number, cfg: EmoneyConfig = DEFAULT_EMONEY) {
	const fee = paid - nominal;
	return { fee, admin: cfg.admin, profit: fee - cfg.admin };
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
