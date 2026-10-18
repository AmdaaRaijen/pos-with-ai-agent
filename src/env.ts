import { defineEnvVars } from '@sveltejs/kit/env';

/** Semua opsional di sini; bagian yang butuh nilainya memeriksa sendiri dan memberi pesan yang jelas. */
const optional = { schema: (value: string | undefined) => value || undefined };

export const variables = defineEnvVars({
	SUPABASE_URL: optional,
	SUPABASE_SERVICE_ROLE_KEY: optional,
	SESSION_SECRET: optional,
	TELEGRAM_BOT_TOKEN: optional,
	TELEGRAM_WEBHOOK_SECRET: optional,
	AI_API_KEY: optional,
	AI_BASE_URL: optional,
	AI_MODEL: optional
});
