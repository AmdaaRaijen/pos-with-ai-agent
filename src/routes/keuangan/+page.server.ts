import { fail } from '@sveltejs/kit';
import { createExpense, dailyStats, deleteExpense, itemStats, listExpenses, stockAdvice } from '#lib/server/data.ts';
import { addDays, wibDate } from '#lib/money.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const today = wibDate();
	const p = url.searchParams.get('p');
	const period = p === '30' || p === 'bulan' ? p : '7';
	const from = period === 'bulan' ? today.slice(0, 8) + '01' : addDays(today, period === '30' ? -29 : -6);

	const [days, items, advice, expenses] = await Promise.all([
		dailyStats(from, today),
		itemStats(from, today),
		stockAdvice(),
		listExpenses(from, today)
	]);
	return { period, from, today, days, expenses, items: items.slice(0, 5), advice: advice.filter((a) => a.buy_qty > 0).slice(0, 5) };
};

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
