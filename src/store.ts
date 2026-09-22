import type { CaptureSnapshot, HeaderValue, QueryValue } from "./capture";

export type CaptureListItem = {
	id: string;
	received_at: string;
	received_at_ms: number;
	method: string;
	path: string;
	query: string | null;
	client_ip: string | null;
	country: string | null;
	colo: string | null;
	content_type: string | null;
	content_length: number | null;
	user_agent: string | null;
	body_is_binary: boolean;
	body_truncated: boolean;
	body_is_empty: boolean;
};

export type CaptureDetail = CaptureListItem & {
	url: string;
	http_protocol: string | null;
	body_sha256: string | null;
	body_r2_key: string | null;
	headers: Record<string, HeaderValue>;
	query_params: Record<string, QueryValue> | null;
	cf: Record<string, unknown> | null;
	body_preview: string | null;
	parsed: unknown | null;
};

export type ListCapturesQuery = {
	limit: number;
	cursor: string | null;
	method: string | null;
	path: string | null;
};

export type ListCapturesResult = {
	captures: CaptureListItem[];
	cursor: string | null;
};

type CaptureRow = {
	id: string;
	received_at: string;
	received_at_ms: number;
	method: string;
	url: string;
	path: string;
	query: string | null;
	query_json: string | null;
	client_ip: string | null;
	country: string | null;
	colo: string | null;
	http_protocol: string | null;
	content_type: string | null;
	content_length: number | null;
	body_sha256: string | null;
	body_r2_key: string | null;
	headers_json: string;
	cf_json: string | null;
	body_preview: string | null;
	parsed_json: string | null;
	body_is_binary: number;
	body_truncated: number;
	body_is_empty: number;
	user_agent: string | null;
};

export async function persistCapture(env: Env, snapshot: CaptureSnapshot): Promise<void> {
	const putOptions: R2PutOptions = {
		customMetadata: { captureId: snapshot.id },
	};
	if (snapshot.contentType) {
		putOptions.httpMetadata = { contentType: snapshot.contentType };
	}
	await env.BUCKET.put(snapshot.bodyR2Key, snapshot.bodyBytes, putOptions);

	await env.DB.prepare(
		`INSERT INTO captures (
      id, received_at, received_at_ms, method, url, path, query, query_json,
      client_ip, country, colo, http_protocol, content_type, content_length,
      body_sha256, body_r2_key, headers_json, cf_json, body_preview, parsed_json,
      body_is_binary, body_truncated, body_is_empty, user_agent
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
	)
		.bind(
			snapshot.id,
			snapshot.receivedAt,
			snapshot.receivedAtMs,
			snapshot.method,
			snapshot.url,
			snapshot.path,
			snapshot.query,
			jsonOrNull(snapshot.queryParams),
			snapshot.clientIp,
			snapshot.country,
			snapshot.colo,
			snapshot.httpProtocol,
			snapshot.contentType,
			snapshot.contentLength,
			snapshot.bodySha256,
			snapshot.bodyR2Key,
			JSON.stringify(snapshot.headers),
			snapshot.cf ? JSON.stringify(snapshot.cf) : null,
			snapshot.bodyPreview,
			snapshot.parsedJson === null ? null : JSON.stringify(snapshot.parsedJson),
			snapshot.bodyIsBinary ? 1 : 0,
			snapshot.bodyTruncated ? 1 : 0,
			snapshot.bodyIsEmpty ? 1 : 0,
			snapshot.userAgent,
		)
		.run();
}

export async function listCaptures(
	env: Env,
	query: ListCapturesQuery,
): Promise<ListCapturesResult> {
	const limit = Math.min(Math.max(query.limit, 1), 100);
	const clauses: string[] = [];
	const binds: Array<string | number> = [];

	if (query.method != null && query.method.length > 0) {
		clauses.push("method = ?");
		binds.push(query.method.toUpperCase());
	}

	if (query.path != null && query.path.length > 0) {
		clauses.push("path LIKE ?");
		binds.push(`${sanitizeLikePrefix(query.path)}%`);
	}

	const cursor = decodeCursor(query.cursor);
	if (cursor) {
		clauses.push("(received_at_ms < ? OR (received_at_ms = ? AND id < ?))");
		binds.push(cursor.receivedAtMs, cursor.receivedAtMs, cursor.id);
	}

	const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
	const rows = await env.DB.prepare(
		`SELECT id, received_at, received_at_ms, method, path, query, client_ip, country, colo,
            content_type, content_length, user_agent, body_is_binary, body_truncated, body_is_empty
     FROM captures
     ${where}
     ORDER BY received_at_ms DESC, id DESC
     LIMIT ?`,
	)
		.bind(...binds, limit + 1)
		.all<CaptureListRow>();

	const results = rows.results;
	const hasMore = results.length > limit;
	const page = hasMore ? results.slice(0, limit) : results;
	const last = page[page.length - 1];

	return {
		captures: page.map(toListItem),
		cursor: hasMore && last ? encodeCursor(last.received_at_ms, last.id) : null,
	};
}

export async function getCapture(env: Env, id: string): Promise<CaptureDetail | null> {
	const row = await env.DB.prepare("SELECT * FROM captures WHERE id = ?")
		.bind(id)
		.first<CaptureRow>();
	if (row == null) {
		return null;
	}
	return toDetail(row);
}

export async function getCaptureBody(
	env: Env,
	id: string,
): Promise<{ body: ReadableStream; contentType: string | undefined } | null> {
	const row = await env.DB.prepare("SELECT body_r2_key, content_type FROM captures WHERE id = ?")
		.bind(id)
		.first<{ body_r2_key: string | null; content_type: string | null }>();
	if (row?.body_r2_key == null) {
		return null;
	}
	const object = await env.BUCKET.get(row.body_r2_key);
	if (object == null) {
		return null;
	}
	return {
		body: object.body,
		contentType: row.content_type ?? object.httpMetadata?.contentType,
	};
}

export async function deleteCapture(env: Env, id: string): Promise<boolean> {
	const row = await env.DB.prepare("SELECT body_r2_key FROM captures WHERE id = ?")
		.bind(id)
		.first<{ body_r2_key: string | null }>();
	if (row == null) {
		return false;
	}
	if (row.body_r2_key != null) {
		await env.BUCKET.delete(row.body_r2_key);
	}
	await env.DB.prepare("DELETE FROM captures WHERE id = ?").bind(id).run();
	return true;
}

export async function deleteAllCaptures(env: Env): Promise<number> {
	const rows = await env.DB.prepare("SELECT body_r2_key FROM captures").all<{
		body_r2_key: string | null;
	}>();
	const keys = rows.results
		.map((row) => row.body_r2_key)
		.filter((key): key is string => key != null && key.length > 0);

	for (let i = 0; i < keys.length; i += 1000) {
		await env.BUCKET.delete(keys.slice(i, i + 1000));
	}

	const result = await env.DB.prepare("DELETE FROM captures").run();
	return result.meta.changes ?? keys.length;
}

type CaptureListRow = {
	id: string;
	received_at: string;
	received_at_ms: number;
	method: string;
	path: string;
	query: string | null;
	client_ip: string | null;
	country: string | null;
	colo: string | null;
	content_type: string | null;
	content_length: number | null;
	user_agent: string | null;
	body_is_binary: number;
	body_truncated: number;
	body_is_empty: number;
};

function toListItem(row: CaptureListRow): CaptureListItem {
	return {
		id: row.id,
		received_at: row.received_at,
		received_at_ms: row.received_at_ms,
		method: row.method,
		path: row.path,
		query: row.query,
		client_ip: row.client_ip,
		country: row.country,
		colo: row.colo,
		content_type: row.content_type,
		content_length: row.content_length,
		user_agent: row.user_agent,
		body_is_binary: row.body_is_binary === 1,
		body_truncated: row.body_truncated === 1,
		body_is_empty: row.body_is_empty === 1,
	};
}

function toDetail(row: CaptureRow): CaptureDetail {
	return {
		...toListItem(row),
		url: row.url,
		http_protocol: row.http_protocol,
		body_sha256: row.body_sha256,
		body_r2_key: row.body_r2_key,
		headers: parseJson(row.headers_json, {}),
		query_params: parseJson(row.query_json, null),
		cf: parseJson(row.cf_json, null),
		body_preview: row.body_preview,
		parsed: parseJson(row.parsed_json, null),
	};
}

function parseJson<T>(value: string | null, fallback: T): T {
	if (value == null || value.length === 0) {
		return fallback;
	}
	try {
		return JSON.parse(value) as T;
	} catch {
		return fallback;
	}
}

function jsonOrNull(value: Record<string, QueryValue>): string | null {
	return Object.keys(value).length === 0 ? null : JSON.stringify(value);
}

function sanitizeLikePrefix(prefix: string): string {
	return prefix.replace(/[%_]/g, "");
}

function encodeCursor(receivedAtMs: number, id: string): string {
	return btoa(`${receivedAtMs}:${id}`);
}

function decodeCursor(cursor: string | null): { receivedAtMs: number; id: string } | null {
	if (cursor == null || cursor.length === 0) {
		return null;
	}
	try {
		const decoded = atob(cursor);
		const sep = decoded.indexOf(":");
		if (sep === -1) {
			return null;
		}
		const receivedAtMs = Number(decoded.slice(0, sep));
		const id = decoded.slice(sep + 1);
		if (!Number.isFinite(receivedAtMs) || id.length === 0) {
			return null;
		}
		return { receivedAtMs, id };
	} catch {
		return null;
	}
}
