const COOKIE_NAME = "inspect_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export { COOKIE_NAME, COOKIE_MAX_AGE };

export function extractProvidedToken(request: Request): string | undefined {
	const header = request.headers.get("Authorization");
	if (header?.toLowerCase().startsWith("bearer ")) {
		const token = header.slice(7).trim();
		if (token.length > 0) {
			return token;
		}
	}

	return readCookie(request.headers.get("Cookie"), COOKIE_NAME);
}

export async function tokensMatch(
	provided: string | undefined,
	expected: string | undefined,
): Promise<boolean> {
	const left = provided ?? "";
	const right = expected ?? "";
	const [leftDigest, rightDigest] = await Promise.all([sha256(left), sha256(right)]);
	const equal = crypto.subtle.timingSafeEqual(leftDigest, rightDigest);
	return equal && left.length > 0 && right.length > 0;
}

export async function isAuthorized(
	request: Request,
	expected: string | undefined,
): Promise<boolean> {
	return tokensMatch(extractProvidedToken(request), expected);
}

export function safeNextPath(raw: string | null | undefined): string {
	if (raw == null || raw.length === 0) {
		return "/";
	}
	if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) {
		return "/";
	}
	return raw;
}

function readCookie(header: string | null, name: string): string | undefined {
	if (header == null || header.length === 0) {
		return undefined;
	}

	for (const part of header.split(";")) {
		const trimmed = part.trim();
		const eq = trimmed.indexOf("=");
		if (eq === -1) {
			continue;
		}
		if (trimmed.slice(0, eq) !== name) {
			continue;
		}
		const value = trimmed.slice(eq + 1).trim();
		if (value.length === 0) {
			return undefined;
		}
		try {
			return decodeURIComponent(value);
		} catch {
			return value;
		}
	}

	return undefined;
}

async function sha256(value: string): Promise<Uint8Array> {
	const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
	return new Uint8Array(digest);
}
