import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '$app/env/private';

let client: any | undefined;

/** Klien Supabase dengan service role. Hanya boleh dipakai di server. */
export function db() {
	if (!client) {
		if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
			throw new Error('SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY belum diisi di .env');
		}
		client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
			auth: { persistSession: false, autoRefreshToken: false }
		});
	}
	return client;
}

/** Lempar error berbahasa sederhana kalau query gagal */
export function must<T>(res: { data: T; error: { message: string } | null }): T {
	if (res.error) throw new Error(res.error.message);
	return res.data;
}
