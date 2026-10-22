import { getData } from '#lib/api.ts';
import type { PageLoad } from './$types';
import type { riwayat } from '#lib/server/pages.ts';

// Tidak di-await: halaman langsung pindah, datanya menyusul (ditampilkan Stream.svelte)
export const load: PageLoad = ({ fetch }) => ({ main: getData<Awaited<ReturnType<typeof riwayat>>>(fetch, '/api/data/riwayat') });
