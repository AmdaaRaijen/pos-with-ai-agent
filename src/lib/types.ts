export type Product = {
	id: string;
	name: string;
	variant: string | null;
	kind: 'barang' | 'emoney';
	buy_price: number;
	sell_price: number;
	stock: number;
	active: boolean;
};

export type SaleItem = {
	id: string;
	sale_id: string;
	product_id: string | null;
	name: string;
	kind: 'barang' | 'emoney';
	qty: number;
	unit_price: number;
	unit_cost: number;
	nominal: number | null;
	profit: number;
};

export type Sale = {
	id: string;
	created_at: string;
	total: number;
	profit: number;
	note: string | null;
	source: string;
	sale_items: SaleItem[];
};

/** Baris yang dikirim ke create_sale / update_sale */
export type CartLine = { product_id: string; qty: number; nominal?: number; paid?: number; unit_price?: number };

export type DayStat = { day: string; total: number; profit: number; trx: number; expense: number };
export type Expense = { id: string; spent_on: string; name: string; amount: number; source: string };
export type ItemStat = { product_id: string | null; name: string; kind: string; qty: number; total: number; profit: number };

/** "Kopi - Es" kalau ada varian, kalau tidak "Kopi" */
export const label = (p: { name: string; variant?: string | null }) => (p.variant ? `${p.name} - ${p.variant}` : p.name);
