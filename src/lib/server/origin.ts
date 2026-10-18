/**
 * Alamat publik aplikasi. Di belakang proxy/tunnel (ngrok, Vercel, dll) server hanya melihat
 * http biasa, jadi protokol dan host asli dibaca dari header x-forwarded-*.
 */
export function publicOrigin(request: Request, url: URL): string {
	const proto = request.headers.get('x-forwarded-proto')?.split(',')[0].trim() || url.protocol.replace(':', '');
	const host = request.headers.get('x-forwarded-host')?.split(',')[0].trim() || request.headers.get('host') || url.host;
	return `${proto}://${host}`;
}
