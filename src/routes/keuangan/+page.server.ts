import { fail } from '@sveltejs/kit';
import { createExpense, deleteExpense } from '#lib/server/data.ts';
import { wibDate } from '#lib/money.ts';
import type { Actions } from './$types';

export const actions: Actions = {
	addExpense: async ({ request }) => {
		const f = await request.formData();
		const name = String(f.get('name') ?? '').trim().slice(0, 80);
		const amount = Math.round(Number(f.get('amount')) || 0);
		const date = String(f.get('date') ?? '');
		if (!name) return fail(400, { error: 'Tulis untuk apa pengeluarannya.' });
		if (amount <= 0) return fail(400, { error: 'Jumlah harus lebih dari 0.' });
		if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > wibDate()) return fail(400, { error: 'Tanggal tidak valid.' });
		try {
			await createExpense(name, amount, date, 'web');
		} catch (e) {
			return fail(400, { error: e instanceof Error ? e.message : 'Gagal menyimpan.' });
		}
		return { saved: true };
	},

	removeExpense: async ({ request }) => {
		const id = String((await request.formData()).get('id') ?? '');
		if (!id) return fail(400, { error: 'Data tidak ditemukan.' });
		await deleteExpense(id);
		return { removed: true };
	}
};
