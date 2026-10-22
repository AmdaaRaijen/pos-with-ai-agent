import { browser } from '$app/env';

/**
 * Ambil data halaman tanpa menahan perpindahan halaman: dipanggil dari load tanpa await,
 * hasilnya (promise) ditampilkan oleh Stream.svelte dengan skeleton selama menunggu.
 */
export function getData<T>(f: typeof fetch, path: string): Promise<T> {
	// Di server tidak ada yang menampilkan hasilnya; browser mengambil sendiri setelah hydrate
	if (!browser) return new Promise<T>(() => {});
	return f(path).then((r) => {
		if (r.status === 401) location.assign('/login');
		if (!r.ok) throw new Error(`Gagal memuat (${r.status})`);
		return r.json() as Promise<T>;
	});
}
