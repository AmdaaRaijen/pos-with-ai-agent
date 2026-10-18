import { timingSafeEqual } from 'node:crypto';
import { TELEGRAM_WEBHOOK_SECRET } from '$app/env/private';
import { json } from '@sveltejs/kit';
import { ask, type Turn } from '#lib/server/assistant.ts';
import { db, must } from '#lib/server/db.ts';
import { getWhitelist } from '#lib/server/data.ts';
import { askForContact, removeKeyboard, sendMessage, sendTyping } from '#lib/server/telegram.ts';
import { normalizePhone } from '#lib/money.ts';
import type { RequestHandler } from './$types';

type Update = {
	update_id: number;
	message?: {
		chat: { id: number; type: string };
		from?: { id: number; first_name?: string };
		text?: string;
		contact?: { phone_number: string; user_id?: number };
	};
};

type Link = { chat_id: number; phone: string; history: Turn[] };

// Telegram mengirim ulang update kalau balasan lambat. Simpan id terakhir supaya tidak diproses dua kali.
const seen = new Set<number>();

function validSecret(header: string | null) {
	const want = TELEGRAM_WEBHOOK_SECRET;
	if (!want || !header) return false;
	const a = Buffer.from(header);
	const b = Buffer.from(want);
	return a.length === b.length && timingSafeEqual(a, b);
}

const HELP = `Saya asisten toko Ibu. Coba tulis, misalnya:
- "jual 2 kopi dan 1 teh"
- "isi saldo DANA 200rb"
- "untung hari ini berapa?"
- "stok apa yang hampir habis?"
- "tambah barang gula, beli 14000, jual 16000, stok 10"
- "apa yang perlu dibawa di tas besok?"`;

export const POST: RequestHandler = async ({ request }) => {
	if (!validSecret(request.headers.get('x-telegram-bot-api-secret-token'))) return new Response('Forbidden', { status: 403 });

	const update = (await request.json()) as Update;
	const msg = update.message;
	if (!msg || msg.chat.type !== 'private' || !msg.from) return json({ ok: true });

	if (seen.has(update.update_id)) return json({ ok: true });
	seen.add(update.update_id);
	if (seen.size > 200) seen.delete(seen.values().next().value!);

	const chatId = msg.chat.id;
	try {
		const whitelist = (await getWhitelist()).map(normalizePhone);
		const link = must(await db().from('telegram_links').select('*').eq('chat_id', chatId).maybeSingle()) as Link | null;

		// 1. Pengguna membagikan kontak: cocokkan nomor dengan daftar yang diizinkan
		if (msg.contact) {
			if (msg.contact.user_id !== msg.from.id) {
				await sendMessage(chatId, 'Itu nomor orang lain. Tekan tombol "Bagikan nomor HP" untuk nomor Ibu sendiri ya.');
			} else if (!whitelist.includes(normalizePhone(msg.contact.phone_number))) {
				await sendMessage(chatId, 'Maaf, nomor ini belum didaftarkan. Minta pemilik toko menambahkan nomornya di menu Pengaturan aplikasi.', removeKeyboard);
			} else {
				must(
					await db().from('telegram_links').upsert({
						chat_id: chatId,
						phone: normalizePhone(msg.contact.phone_number),
						name: msg.from.first_name ?? null
					})
				);
				await sendMessage(chatId, `Terima kasih${msg.from.first_name ? ', ' + msg.from.first_name : ''}! Nomor Ibu sudah terdaftar.\n\n${HELP}`, removeKeyboard);
			}
			return json({ ok: true });
		}

		// 2. Belum terdaftar, atau nomornya sudah dicabut dari daftar
		if (!link || !whitelist.includes(link.phone)) {
			if (link) must(await db().from('telegram_links').delete().eq('chat_id', chatId));
			await askForContact(chatId);
			return json({ ok: true });
		}

		// 3. Sudah terdaftar
		const text = msg.text?.trim();
		if (!text) {
			await sendMessage(chatId, 'Saya baru bisa membaca tulisan ya, Bu. Coba ketik pesannya.');
			return json({ ok: true });
		}
		if (text === '/start' || text === '/bantuan') {
			await sendMessage(chatId, HELP);
			return json({ ok: true });
		}

		await sendTyping(chatId);
		const out = await ask(Array.isArray(link.history) ? link.history : [], text.slice(0, 1500));
		must(await db().from('telegram_links').update({ history: out.history }).eq('chat_id', chatId));
		await sendMessage(chatId, out.reply);
	} catch (e) {
		console.error('telegram webhook error', e);
		await sendMessage(chatId, 'Maaf Bu, ada gangguan di sistem. Coba lagi sebentar lagi ya.').catch(() => {});
	}
	return json({ ok: true });
};
