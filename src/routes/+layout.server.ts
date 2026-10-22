import { getStoreName } from '#lib/server/data.ts';
import type { LayoutServerLoad } from './$types';

// storeName hanya untuk judul tab: tidak ditunggu supaya halaman tidak tertahan
export const load: LayoutServerLoad = ({ locals }) => {
	const storeName = locals.userId ? getStoreName() : Promise.resolve('Kasir');
	storeName.catch(() => {});
	return { loggedIn: !!locals.userId, storeName };
};
