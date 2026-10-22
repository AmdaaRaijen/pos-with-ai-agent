import { fail } from '@sveltejs/kit';
import { archiveProduct, createProduct, listProducts, updateProduct } from '#lib/server/data.ts';
import type { Actions } from './$types';

const int = (v: FormDataEntryValue | null) => Math.max(0, Math.round(Number(v) || 0));

export const actions: Actions = {
	save: async ({ request }) => {
		const f = await request.formData();
		const id = String(f.get('id') ?? '');
		const name = String(f.get('name') ?? '').trim();
		const kind = f.get('kind') === 'emoney' ? 'emoney' : 'barang';
		const variant = kind === 'barang' ? String(f.get('variant') ?? '').trim().slice(0, 30) || null : null;
		if (!name) return fail(400, { error: 'Nama barang harus diisi.' });
		if (name.length > 60) return fail(400, { error: 'Nama terlalu panjang.' });

		const buy = int(f.get('buy_price'));
		const sell = int(f.get('sell_price'));
		if (kind === 'barang' && !f.get('variants') && sell !== 0 && sell < buy) return fail(400, { error: 'Harga jual lebih kecil dari harga beli. Cek lagi ya.' });

		// Tambah baru dengan beberapa varian sekaligus (stok dipakai bersama)
		const rawVariants = !id && kind === 'barang' ? String(f.get('variants') ?? '') : '';
		if (rawVariants) {
			let list: { variant: string; sell_price: number }[];
			try {
				list = JSON.parse(rawVariants);
			} catch {
				return fail(400, { error: 'Data varian rusak. Coba lagi.' });
			}
			list = list.map((v) => ({ variant: String(v.variant ?? '').trim().slice(0, 30), sell_price: Math.max(0, Math.round(Number(v.sell_price) || 0)) })).filter((v) => v.variant);
			const seen = new Set<string>();
			const existing = new Set(
				(await listProducts()).filter((p) => p.kind === 'barang' && p.name.trim().toLowerCase() === name.toLowerCase()).map((p) => (p.variant ?? '').toLowerCase())
			);
			for (const v of list) {
				const k = v.variant.toLowerCase();
				if (seen.has(k)) return fail(400, { error: `Varian ${v.variant} dipilih dua kali.` });
				if (existing.has(k)) return fail(400, { error: `Varian ${v.variant} sudah ada untuk ${name}.` });
				if (v.sell_price !== 0 && v.sell_price < buy) return fail(400, { error: `Harga jual ${v.variant} lebih kecil dari harga beli. Cek lagi ya.` });
				seen.add(k);
			}
			if (list.length) {
				try {
					for (const v of list) await createProduct({ name, variant: v.variant, kind, buy_price: buy, sell_price: v.sell_price, stock: int(f.get('stock')) });
				} catch (e) {
					return fail(400, { error: e instanceof Error ? e.message : 'Gagal menyimpan.' });
				}
				return { saved: true };
			}
		}

		try {
			if (id) {
				await updateProduct(id, kind === 'emoney' ? { name } : { name, variant, buy_price: buy, sell_price: sell, stock: int(f.get('stock')) });
			} else {
				await createProduct(kind === 'emoney' ? { name, kind } : { name, variant, kind, buy_price: buy, sell_price: sell, stock: int(f.get('stock')) });
			}
		} catch (e) {
			const msg = e instanceof Error ? e.message : '';
			if (msg.includes('products_name_variant_uq')) return fail(400, { error: 'Barang dan varian itu sudah ada.' });
			return fail(400, { error: msg || 'Gagal menyimpan.' });
		}
		return { saved: true };
	},

	remove: async ({ request }) => {
		const id = String((await request.formData()).get('id') ?? '');
		if (!id) return fail(400, { error: 'Barang tidak ditemukan.' });
		await archiveProduct(id);
		return { removed: true };
	}
};
