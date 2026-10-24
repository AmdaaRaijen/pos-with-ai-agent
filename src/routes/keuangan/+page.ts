import { getData } from '#lib/api.ts';
import type { PageLoad } from './$types';
import type { keuangan } from '#lib/server/pages.ts';

export const load: PageLoad = ({ fetch, url }) => ({
	key: url.search,
	main: getData<Awaited<ReturnType<typeof keuangan>>>(fetch, `/api/data/keuangan${url.search}`)
});
