import { error, json } from '@sveltejs/kit';
import * as pages from '#lib/server/pages.ts';
import type { RequestHandler } from './$types';

// Login dicek di hooks.server.ts (semua /api/* tanpa sesi dijawab 401)
export const GET: RequestHandler = async ({ params, url, request }) => {
	let data: unknown;
	switch (params.page) {
		case 'transaksi': data = await pages.transaksi(); break;
		case 'inventory': data = await pages.inventory(); break;
		case 'keuangan': data = await pages.keuangan(url.searchParams.get('p')); break;
		case 'riwayat': data = await pages.riwayat(); break;
		case 'sale': data = await pages.sale(url.searchParams.get('id') ?? ''); break;
		case 'pengaturan': data = await pages.pengaturan(url, request); break;
		default: error(404);
	}
	return json(data, { headers: { 'cache-control': 'no-store' } });
};
