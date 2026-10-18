import { fail } from '@sveltejs/kit';
import { archiveProduct, createProduct, getEmoneyConfig, listProducts, updateProduct } from '#lib/server/data.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [products, emoney] = await Promise.all([listProducts(), getEmoneyConfig()]);
	return { products, emoney };
};

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
		if (kind === 'barang' && sell < buy) return fail(400, { error: 'Harga jual lebih kecil dari harga beli. Cek lagi ya.' });

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
