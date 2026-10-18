import { dailyStats, itemStats, stockAdvice } from '#lib/server/data.ts';
import { addDays, wibDate } from '#lib/money.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const today = wibDate();
	const p = url.searchParams.get('p');
	const period = p === '30' || p === 'bulan' ? p : '7';
	const from = period === 'bulan' ? today.slice(0, 8) + '01' : addDays(today, period === '30' ? -29 : -6);

	const [days, items, advice] = await Promise.all([dailyStats(from, today), itemStats(from, today), stockAdvice()]);
	return { period, from, today, days, items: items.slice(0, 5), advice: advice.filter((a) => a.buy_qty > 0).slice(0, 5) };
};
