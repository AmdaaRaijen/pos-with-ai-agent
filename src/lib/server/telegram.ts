import { TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET } from '$app/env/private';

type Extra = Record<string, unknown>;

async function call<T = unknown>(method: string, body: Extra = {}): Promise<T> {
	if (!TELEGRAM_BOT_TOKEN) throw new Error('TELEGRAM_BOT_TOKEN belum diisi di .env');
	const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(body)
	});
	const json = (await res.json()) as { ok: boolean; result: T; description?: string };
	if (!json.ok) throw new Error(json.description ?? 'Telegram error');
	return json.result;
}

export const telegramReady = () => !!TELEGRAM_BOT_TOKEN && !!TELEGRAM_WEBHOOK_SECRET;

/** Telegram membatasi 4096 karakter per pesan */
export async function sendMessage(chatId: number, text: string, extra: Extra = {}) {
	for (let i = 0; i < text.length || i === 0; i += 3800) {
		await call('sendMessage', { chat_id: chatId, text: text.slice(i, i + 3800), ...(i === 0 ? extra : {}) });
	}
}

export const sendTyping = (chatId: number) => call('sendChatAction', { chat_id: chatId, action: 'typing' }).catch(() => {});

export const askForContact = (chatId: number) =>
	sendMessage(chatId, 'Halo! Supaya saya tahu ini nomor Ibu, tekan tombol "Bagikan nomor HP" di bawah ya.', {
		reply_markup: {
			keyboard: [[{ text: 'Bagikan nomor HP', request_contact: true }]],
			resize_keyboard: true,
			one_time_keyboard: true
		}
	});

export const removeKeyboard = { reply_markup: { remove_keyboard: true } };

export async function connectWebhook(origin: string) {
	await call('setWebhook', {
		url: `${origin}/api/telegram`,
		secret_token: TELEGRAM_WEBHOOK_SECRET,
		allowed_updates: ['message'],
		drop_pending_updates: true
	});
}

export async function botInfo(): Promise<{ username: string } | null> {
	if (!TELEGRAM_BOT_TOKEN) return null;
	try {
		return await call<{ username: string }>('getMe');
	} catch {
		return null;
	}
}

export async function webhookInfo(): Promise<{ url: string; last_error_message?: string } | null> {
	if (!TELEGRAM_BOT_TOKEN) return null;
	try {
		return await call('getWebhookInfo');
	} catch {
		return null;
	}
}
