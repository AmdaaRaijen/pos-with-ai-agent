import { error, fail } from '@sveltejs/kit';
import { getEmoneyConfig, getSale, updateSale } from '#lib/server/data.ts';
import type { CartLine } from '#lib/types.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const sale = await getSale(params.id);
	if (!sale) error(404, 'Transaksi tidak ditemukan');
	return { sale, emoney: await getEmoneyConfig() };
};

export const actions: Actions = {
	save: async ({ request, params }) => {
		const form = await request.formData();
		let lines: CartLine[];
		try {
			lines = JSON.parse(String(form.get('lines') ?? '[]'));
		} catch {
			return fail(400, { error: 'Data rusak. Coba lagi.' });
		}
		if (!Array.isArray(lines) || lines.length === 0) return fail(400, { error: 'Transaksi tidak boleh kosong.' });
		const note = String(form.get('note') ?? '').trim().slice(0, 200) || null;
		try {
			await updateSale(params.id, lines, note);
		} catch (e) {
			return fail(400, { error: e instanceof Error ? e.message : 'Gagal menyimpan.' });
		}
		return { saved: true };
	}
};
