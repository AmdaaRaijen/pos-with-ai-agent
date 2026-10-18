import { listSales } from '#lib/server/data.ts';
import { addDays, wibDate } from '#lib/money.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const today = wibDate();
	return { sales: await listSales(addDays(today, -13), today) };
};
