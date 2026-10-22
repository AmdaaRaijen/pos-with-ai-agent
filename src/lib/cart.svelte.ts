import { emoneyFee, type EmoneyConfig } from './money';
import type { CartLine, Product } from './types';

export type CartItem = { product: Product; qty: number; nominal?: number; paid?: number };

/** Keranjang transaksi. Disimpan di memori saja, hilang kalau halaman ditutup. */
class Cart {
	items = $state<CartItem[]>([]);
	note = $state('');

	count = $derived(this.items.reduce((a, i) => a + (i.product.kind === 'emoney' ? 1 : i.qty), 0));

	qtyOf(productId: string): number {
		return this.items.filter((i) => i.product.id === productId).reduce((a, i) => a + i.qty, 0);
	}

	/** Jumlah di keranjang untuk satu barang, semua variannya dihitung (stok dipakai bersama) */
	private groupQty(p: Product): number {
		const n = p.name.trim().toLowerCase();
		return this.items
			.filter((i) => i.product.kind === 'barang' && i.product.name.trim().toLowerCase() === n)
			.reduce((a, i) => a + i.qty, 0);
	}

	canAdd(p: Product): boolean {
		return this.groupQty(p) < p.stock;
	}

	addGoods(p: Product) {
		if (!this.canAdd(p)) return;
		const cur = this.items.find((i) => i.product.id === p.id);
		if (cur) cur.qty++;
		else this.items.push({ product: p, qty: 1 });
	}

	addEmoney(p: Product, nominal: number, paid: number) {
		this.items.push({ product: p, qty: 1, nominal, paid });
	}

	change(index: number, delta: number) {
		const it = this.items[index];
		if (!it || it.product.kind === 'emoney') return;
		const q = it.qty + delta;
		if (q <= 0) this.items.splice(index, 1);
		else if (delta < 0 || this.canAdd(it.product)) it.qty = q;
	}

	remove(index: number) {
		this.items.splice(index, 1);
	}

	clear() {
		this.items = [];
		this.note = '';
	}

	/** Pemasukan toko, untung, dan uang yang harus dibayar pelanggan */
	totals(cfg: EmoneyConfig) {
		let total = 0;
		let profit = 0;
		let pass = 0;
		for (const i of this.items) {
			if (i.product.kind === 'emoney') {
				const f = emoneyFee(i.nominal ?? 0, i.paid ?? 0, cfg);
				total += f.fee;
				profit += f.profit;
				pass += i.nominal ?? 0;
			} else {
				total += i.product.sell_price * i.qty;
				profit += (i.product.sell_price - i.product.buy_price) * i.qty;
			}
		}
		return { total, profit, pay: total + pass };
	}

	lines(): CartLine[] {
		return this.items.map((i) =>
			i.product.kind === 'emoney'
				? { product_id: i.product.id, qty: 1, nominal: i.nominal, paid: i.paid }
				: { product_id: i.product.id, qty: i.qty }
		);
	}
}

export const cart = new Cart();
