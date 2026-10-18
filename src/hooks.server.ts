import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit/hooks';
import { COOKIE, readSession } from '#lib/server/auth.ts';

// Halaman yang boleh dibuka tanpa login. Webhook Telegram punya pengaman sendiri (secret token).
const PUBLIC = ['/login', '/api/telegram'];

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.userId = readSession(event.cookies.get(COOKIE));

	const path = event.url.pathname;
	if (!event.locals.userId && !PUBLIC.some((p) => path === p || path.startsWith(p + '/'))) {
		if (path.startsWith('/api/')) return new Response('Unauthorized', { status: 401 });
		redirect(303, '/login');
	}
	return resolve(event);
};
