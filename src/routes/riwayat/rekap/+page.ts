import { getData } from '#lib/api.ts';
import type { PageLoad } from './$types';
import type { inventory } from '#lib/server/pages.ts';

export const load: PageLoad = ({ fetch }) => ({ main: getData<Awaited<ReturnType<typeof inventory>>>(fetch, '/api/data/inventory') });
