const PREVIEW_BYTES = 8 * 1024;

export type QueryValue = string | string[];
export type HeaderValue = string | string[];

export type CaptureSnapshot = {
	id: string;
	receivedAt: string;
	receivedAtMs: number;
	method: string;
	url: string;
	path: string;
	query: string | null;
	queryParams: Record<string, QueryValue>;
	clientIp: string | null;
	country: string | null;
	colo: string | null;
	httpProtocol: string | null;
	contentType: string | null;
	contentLength: number;
	bodySha256: string;
	bodyR2Key: string;
	headers: Record<string, HeaderValue>;
	cf: Record<string, unknown> | null;
	bodyPreview: string | null;
	parsedJson: unknown | null;
	bodyIsBinary: boolean;
	bodyTruncated: boolean;
	bodyIsEmpty: boolean;
	userAgent: string | null;
	bodyBytes: Uint8Array;
};

export async function snapshotRequest(
	request: Request,
	maxBytes: number,
): Promise<CaptureSnapshot> {
	const receivedAtMs = Date.now();
	const receivedAt = new Date(receivedAtMs).toISOString();
	const id = crypto.randomUUID();
	const url = new URL(request.url);
	const contentType = request.headers.get("Content-Type");
	const { bytes, truncated } = await readBodyCapped(request, maxBytes);
	const bodyIsEmpty = bytes.byteLength === 0;
	const bodyIsBinary = !bodyIsEmpty && looksBinary(bytes, contentType);
	const bodyPreview = bodyIsEmpty || bodyIsBinary ? null : utf8Preview(bytes, PREVIEW_BYTES);
	const parsedJson = parseJsonBody(contentType, bytes, truncated);

	const cf = pickCf(request.cf);
	const countryFromCf =
		cf && typeof cf.country === "string" ? cf.country : request.headers.get("CF-IPCountry");

	return {
		id,
		receivedAt,
		receivedAtMs,
		method: request.method.toUpperCase(),
		url: request.url,
		path: url.pathname,
		query: url.search.length > 1 ? url.search.slice(1) : null,
		queryParams: collectSearchParams(url.searchParams),
		clientIp: clientIp(request),
		country: countryFromCf,
		colo: cf && typeof cf.colo === "string" ? cf.colo : null,
		httpProtocol: cf && typeof cf.httpProtocol === "string" ? cf.httpProtocol : null,
		contentType,
		contentLength: bytes.byteLength,
		bodySha256: await sha256Hex(bytes),
		bodyR2Key: `bodies/${id}`,
		headers: collectHeaders(request.headers),
		cf,
		bodyPreview,
		parsedJson,
		bodyIsBinary,
		bodyTruncated: truncated,
		bodyIsEmpty,
		userAgent: request.headers.get("User-Agent"),
		bodyBytes: bytes,
	};
}

export function bodyMaxBytes(env: Env): number {
	const parsed = Number(env.BODY_MAX_BYTES);
	if (Number.isFinite(parsed) && parsed > 0) {
		return parsed;
	}
	return 10 * 1024 * 1024;
}

async function readBodyCapped(
	request: Request,
	maxBytes: number,
): Promise<{ bytes: Uint8Array; truncated: boolean }> {
	if (request.body == null) {
		return { bytes: new Uint8Array(), truncated: false };
	}

	const reader = request.body.getReader();
	const chunks: Uint8Array[] = [];
	let total = 0;
	let truncated = false;

	for (;;) {
		const { done, value } = await reader.read();
		if (done) {
			break;
		}
		if (value == null || value.byteLength === 0) {
			continue;
		}
		if (total >= maxBytes) {
			truncated = true;
			await reader.cancel();
			break;
		}
		if (total + value.byteLength > maxBytes) {
			chunks.push(value.subarray(0, maxBytes - total));
			total = maxBytes;
			truncated = true;
			await reader.cancel();
			break;
		}
		chunks.push(value);
		total += value.byteLength;
	}

	return { bytes: concat(chunks, total), truncated };
}

function concat(chunks: Uint8Array[], total: number): Uint8Array {
	const out = new Uint8Array(total);
	let offset = 0;
	for (const chunk of chunks) {
		out.set(chunk, offset);
		offset += chunk.byteLength;
	}
	return out;
}

function collectHeaders(headers: Headers): Record<string, HeaderValue> {
	const out: Record<string, HeaderValue> = {};
	headers.forEach((value, key) => {
		const existing = out[key];
		if (existing === undefined) {
			out[key] = value;
			return;
		}
		if (Array.isArray(existing)) {
			existing.push(value);
			return;
		}
		out[key] = [existing, value];
	});
	return out;
}

function collectSearchParams(params: URLSearchParams): Record<string, QueryValue> {
	const out: Record<string, QueryValue> = {};
	for (const [key, value] of params.entries()) {
		const existing = out[key];
		if (existing === undefined) {
			out[key] = value;
			continue;
		}
		if (Array.isArray(existing)) {
			existing.push(value);
			continue;
		}
		out[key] = [existing, value];
	}
	return out;
}

function clientIp(request: Request): string | null {
	const connecting = request.headers.get("CF-Connecting-IP");
	if (connecting != null && connecting.length > 0) {
		return connecting;
	}
	const forwarded = request.headers.get("X-Forwarded-For");
	if (forwarded == null || forwarded.length === 0) {
		return null;
	}
	const first = forwarded.split(",")[0];
	return first ? first.trim() : null;
}

function pickCf(cf: Request["cf"]): Record<string, unknown> | null {
	if (cf == null || !("colo" in cf)) {
		return null;
	}

	const rtt = cf.clientTcpRtt ?? cf.clientQuicRtt;
	return {
		colo: cf.colo,
		country: cf.country,
		region: cf.region,
		regionCode: cf.regionCode,
		timezone: cf.timezone,
		city: cf.city,
		continent: cf.continent,
		asn: cf.asn,
		asOrganization: cf.asOrganization,
		httpProtocol: cf.httpProtocol,
		tlsCipher: cf.tlsCipher,
		tlsVersion: cf.tlsVersion,
		clientTcpRtt: cf.clientTcpRtt,
		clientQuicRtt: cf.clientQuicRtt,
		rtt,
	};
}

function looksBinary(bytes: Uint8Array, contentType: string | null): boolean {
	const ct = (contentType ?? "").toLowerCase();
	if (ct.startsWith("text/")) {
		return false;
	}
	if (
		ct.includes("json") ||
		ct.includes("xml") ||
		ct.includes("javascript") ||
		ct.includes("urlencoded") ||
		ct.includes("graphql") ||
		ct.includes("csv")
	) {
		return false;
	}
	if (
		ct.startsWith("image/") ||
		ct.startsWith("audio/") ||
		ct.startsWith("video/") ||
		ct.includes("octet-stream") ||
		ct.includes("wasm") ||
		ct.includes("protobuf") ||
		ct.includes("gzip") ||
		ct.includes("zip")
	) {
		return true;
	}

	const sample = Math.min(bytes.byteLength, 1024);
	for (let i = 0; i < sample; i += 1) {
		if (bytes[i] === 0) {
			return true;
		}
	}
	return false;
}

function utf8Preview(bytes: Uint8Array, maxBytes: number): string {
	const slice = bytes.byteLength > maxBytes ? bytes.subarray(0, maxBytes) : bytes;
	return new TextDecoder("utf-8").decode(slice);
}

function parseJsonBody(
	contentType: string | null,
	bytes: Uint8Array,
	truncated: boolean,
): unknown | null {
	if (truncated || bytes.byteLength === 0) {
		return null;
	}
	const ct = (contentType ?? "").toLowerCase();
	if (!ct.includes("json")) {
		return null;
	}
	try {
		return JSON.parse(new TextDecoder("utf-8").decode(bytes));
	} catch {
		return null;
	}
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
	const digest = await crypto.subtle.digest("SHA-256", bytes);
	const hash = new Uint8Array(digest);
	let hex = "";
	for (const byte of hash) {
		hex += byte.toString(16).padStart(2, "0");
	}
	return hex;
}
