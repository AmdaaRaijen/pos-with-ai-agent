import { getData } from '#lib/api.ts';
import { periodOf } from '#lib/money.ts';
import type { PageLoad } from './$types';
import type { keuangan } from '#lib/server/pages.ts';

export const load: PageLoad = ({ fetch, url }) => {
	const period = periodOf(url.searchParams.get('p'));
	return { period, main: getData<Awaited<ReturnType<typeof keuangan>>>(fetch, `/api/data/keuangan?p=${period}`) };
};
