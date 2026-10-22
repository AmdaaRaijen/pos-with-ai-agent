import { fail, redirect } from '@sveltejs/kit';
import { deleteSale, updateSale } from '#lib/server/data.ts';
import type { CartLine } from '#lib/types.ts';
import type { Actions } from './$types';

export const actions: Actions = {
	remove: async ({ params }) => {
		try {
			await deleteSale(params.id);
		} catch (e) {
			return fail(400, { error: e instanceof Error ? e.message : 'Gagal menghapus.' });
		}
		redirect(303, '/riwayat');
	},

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
