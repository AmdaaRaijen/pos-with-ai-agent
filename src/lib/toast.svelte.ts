type Toast = { id: number; text: string; tone: 'ok' | 'error' };

export const toasts = $state<Toast[]>([]);
let next = 0;

export function toast(text: string, tone: Toast['tone'] = 'ok') {
	const id = ++next;
	toasts.push({ id, text, tone });
	setTimeout(
		() => {
			const i = toasts.findIndex((t) => t.id === id);
			if (i >= 0) toasts.splice(i, 1);
		},
		tone === 'error' ? 5000 : 2600
	);
}
