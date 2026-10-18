import { fail } from '@sveltejs/kit';
import { createSale, getEmoneyConfig, listProducts, summary } from '#lib/server/data.ts';
import { wibDate } from '#lib/money.ts';
import type { CartLine } from '#lib/types.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const today = wibDate();
	const [products, emoney, sum] = await Promise.all([listProducts(), getEmoneyConfig(), summary(today, today)]);
	return { products, emoney, today: sum };
};

export const actions: Actions = {
	save: async ({ request }) => {
		const form = await request.formData();
		let lines: CartLine[];
		try {
			lines = JSON.parse(String(form.get('lines') ?? '[]'));
		} catch {
			return fail(400, { error: 'Data keranjang rusak. Coba lagi.' });
		}
		if (!Array.isArray(lines) || lines.length === 0) return fail(400, { error: 'Keranjang masih kosong.' });
		const note = String(form.get('note') ?? '').trim().slice(0, 200) || null;
		try {
			await createSale(lines, note, 'web');
		} catch (e) {
			return fail(400, { error: e instanceof Error ? e.message : 'Gagal menyimpan.' });
		}
		return { saved: true };
	}
};
