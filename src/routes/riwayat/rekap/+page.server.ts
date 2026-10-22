import { fail, redirect } from '@sveltejs/kit';
import { createSale } from '#lib/server/data.ts';
import { atWib, isPastOrToday } from '#lib/money.ts';
import type { CartLine } from '#lib/types.ts';
import type { Actions } from './$types';

export const actions: Actions = {
	save: async ({ request }) => {
		const form = await request.formData();
		let lines: CartLine[];
		try {
			lines = JSON.parse(String(form.get('lines') ?? '[]'));
		} catch {
			return fail(400, { error: 'Data rekap rusak. Coba lagi.' });
		}
		if (!Array.isArray(lines) || lines.length === 0) return fail(400, { error: 'Isi rekap masih kosong.' });
		const date = form.get('date');
		if (!isPastOrToday(date)) return fail(400, { error: 'Tanggal tidak valid.' });
		const note = String(form.get('note') ?? '').trim().slice(0, 200) || null;
		try {
			await createSale(lines, note, 'web', { at: atWib(date), stock: false });
		} catch (e) {
			return fail(400, { error: e instanceof Error ? e.message : 'Gagal menyimpan.' });
		}
		redirect(303, '/riwayat');
	}
};
