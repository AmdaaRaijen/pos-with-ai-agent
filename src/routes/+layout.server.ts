import { getStoreName } from '#lib/server/data.ts';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	return { loggedIn: !!locals.userId, storeName: locals.userId ? await getStoreName() : 'Kasir' };
};
