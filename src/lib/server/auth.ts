import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { SESSION_SECRET } from '$app/env/private';
import { db, must } from './db';

export const COOKIE = 'pos_session';
const MAX_AGE = 60 * 60 * 24 * 30;

export function hashPassword(password: string): string {
	const salt = randomBytes(16);
	return salt.toString('hex') + ':' + scryptSync(password, salt, 64).toString('hex');
}

export function verifyPassword(password: string, stored: string): boolean {
	const [salt, hash] = stored.split(':');
	if (!salt || !hash) return false;
	const a = scryptSync(password, Buffer.from(salt, 'hex'), 64);
	const b = Buffer.from(hash, 'hex');
	return a.length === b.length && timingSafeEqual(a, b);
}

function secret() {
	if (!SESSION_SECRET || SESSION_SECRET.length < 16) {
		throw new Error('SESSION_SECRET belum diisi di .env (minimal 16 karakter)');
	}
	return SESSION_SECRET;
}

const sign = (payload: string) => createHmac('sha256', secret()).update(payload).digest('base64url');

export function makeSession(userId: string) {
	const payload = Buffer.from(JSON.stringify({ u: userId, e: Date.now() + MAX_AGE * 1000 })).toString('base64url');
	return { value: `${payload}.${sign(payload)}`, maxAge: MAX_AGE };
}

/** Kembalikan id user kalau cookie valid dan belum kedaluwarsa */
export function readSession(cookie: string | undefined): string | null {
	if (!cookie) return null;
	const [payload, sig] = cookie.split('.');
	if (!payload || !sig) return null;
	const expected = sign(payload);
	const a = Buffer.from(sig);
	const b = Buffer.from(expected);
	if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
	try {
		const { u, e } = JSON.parse(Buffer.from(payload, 'base64url').toString());
		return e > Date.now() ? u : null;
	} catch {
		return null;
	}
}

export async function userCount(): Promise<number> {
	const res = await db().from('app_users').select('id', { count: 'exact', head: true });
	if (res.error) throw new Error(res.error.message);
	return res.count ?? 0;
}

export async function findUser(username: string) {
	return must(
		await db().from('app_users').select('id, username, password_hash').eq('username', username.toLowerCase()).maybeSingle()
	) as { id: string; username: string; password_hash: string } | null;
}

export async function createUser(username: string, password: string) {
	return must(
		await db()
			.from('app_users')
			.insert({ username: username.toLowerCase(), password_hash: hashPassword(password) })
			.select('id')
			.single()
	) as { id: string };
}

// Batas percobaan login sederhana (per instance server), cukup untuk toko kecil.
const attempts = new Map<string, { n: number; until: number }>();
export function loginBlocked(key: string): boolean {
	const a = attempts.get(key);
	return !!a && a.n >= 8 && a.until > Date.now();
}
export function loginFailed(key: string) {
	const a = attempts.get(key);
	attempts.set(key, { n: (a && a.until > Date.now() ? a.n : 0) + 1, until: Date.now() + 10 * 60_000 });
}
export function loginOk(key: string) {
	attempts.delete(key);
}
