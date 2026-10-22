import { getData } from '#lib/api.ts';
import type { PageLoad } from './$types';
import type { pengaturan } from '#lib/server/pages.ts';

// Tidak di-await: halaman langsung pindah, datanya menyusul (ditampilkan Stream.svelte)
export const load: PageLoad = ({ fetch }) => ({ main: getData<Awaited<ReturnType<typeof pengaturan>>>(fetch, '/api/data/pengaturan') });
