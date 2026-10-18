import { fail, redirect } from '@sveltejs/kit';
import {
	COOKIE,
	createUser,
	findUser,
	loginBlocked,
	loginFailed,
	loginOk,
	makeSession,
	userCount,
	verifyPassword
} from '#lib/server/auth.ts';
import { publicOrigin } from '#lib/server/origin.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.userId) redirect(303, '/');
	return { firstRun: (await userCount()) === 0 };
};

export const actions: Actions = {
	default: async ({ request, cookies, getClientAddress, url }) => {
		const secure = publicOrigin(request, url).startsWith('https://');
		const form = await request.formData();
		const username = String(form.get('username') ?? '').trim().toLowerCase();
		const password = String(form.get('password') ?? '');
		const firstRun = (await userCount()) === 0;

		if (!username || !password) return fail(400, { username, error: 'Isi nama pengguna dan kata sandi.' });

		let userId: string;
		if (firstRun) {
			if (!/^[a-z0-9_.-]{3,30}$/.test(username)) {
				return fail(400, { username, error: 'Nama pengguna 3-30 huruf kecil, angka, atau _ . -' });
			}
			if (password.length < 6) return fail(400, { username, error: 'Kata sandi minimal 6 karakter.' });
			userId = (await createUser(username, password)).id;
		} else {
			const key = getClientAddress();
			if (loginBlocked(key)) return fail(429, { username, error: 'Terlalu banyak percobaan. Coba lagi 10 menit lagi.' });
			const user = await findUser(username);
			if (!user || !verifyPassword(password, user.password_hash)) {
				loginFailed(key);
				return fail(400, { username, error: 'Nama pengguna atau kata sandi salah.' });
			}
			loginOk(key);
			userId = user.id;
		}

		const s = makeSession(userId);
		cookies.set(COOKIE, s.value, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure,
			maxAge: s.maxAge
		});
		redirect(303, '/');
	}
};
