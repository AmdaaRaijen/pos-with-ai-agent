import { getData } from '#lib/api.ts';
import type { PageLoad } from './$types';
import type { sale } from '#lib/server/pages.ts';

export const load: PageLoad = ({ fetch, params }) => ({
	main: getData<Awaited<ReturnType<typeof sale>>>(fetch, `/api/data/sale?id=${encodeURIComponent(params.id)}`)
});
