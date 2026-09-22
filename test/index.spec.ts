import {
	createExecutionContext,
	createScheduledController,
	env,
	SELF,
} from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import worker from "../src/index";

const TOKEN = "local-dev-inspect-token";

function authHeaders(extra?: HeadersInit): Headers {
	const headers = new Headers(extra);
	headers.set("Authorization", `Bearer ${TOKEN}`);
	return headers;
}

describe("webhook capture worker", () => {
	beforeEach(async () => {
		await env.DB.prepare("DELETE FROM captures").run();
	});

	it("captures POST /anything and returns an id", async () => {
		const response = await SELF.fetch("https://example.com/stripe/webhook?mode=live", {
			method: "POST",
			headers: { "Content-Type": "application/json", "User-Agent": "Stripe/1.0" },
			body: JSON.stringify({ hello: "world" }),
		});
		expect(response.status).toBe(200);
		const payload = await response.json<{ ok: boolean; id: string }>();
		expect(payload.ok).toBe(true);
		expect(payload.id).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
		);

		const detail = await SELF.fetch(`https://example.com/api/captures/${payload.id}`, {
			headers: authHeaders(),
		});
		expect(detail.status).toBe(200);
		const body = await detail.json<{
			method: string;
			path: string;
			parsed: { hello: string };
			query: string;
		}>();
		expect(body.method).toBe("POST");
		expect(body.path).toBe("/stripe/webhook");
		expect(body.query).toBe("mode=live");
		expect(body.parsed.hello).toBe("world");
	});

	it("rejects JSON API calls without a token", async () => {
		const response = await SELF.fetch("https://example.com/api/captures");
		expect(response.status).toBe(401);
		expect(await response.json()).toEqual({ error: "unauthorized" });
	});

	it("does not capture reserved inspector paths", async () => {
		const login = await SELF.fetch("https://example.com/login");
		expect(login.status).toBe(200);
		expect(await login.text()).toContain("INTERCEPT");

		const favicon = await SELF.fetch("https://example.com/favicon.ico");
		expect(favicon.status).toBe(204);

		const robots = await SELF.fetch("https://example.com/robots.txt");
		expect(robots.status).toBe(200);

		const list = await SELF.fetch("https://example.com/api/captures", {
			headers: authHeaders(),
		});
		const payload = await list.json<{ captures: unknown[] }>();
		expect(payload.captures).toEqual([]);
	});

	it("lists and deletes captures with bearer auth", async () => {
		await SELF.fetch("https://example.com/github", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ event: "push" }),
		});

		const listed = await SELF.fetch("https://example.com/api/captures?path=/github", {
			headers: authHeaders(),
		});
		const payload = await listed.json<{ captures: Array<{ id: string; path: string }> }>();
		expect(payload.captures).toHaveLength(1);
		expect(payload.captures[0]?.path).toBe("/github");

		const deleted = await SELF.fetch(`https://example.com/api/captures/${payload.captures[0]?.id}`, {
			method: "DELETE",
			headers: authHeaders(),
		});
		expect(deleted.status).toBe(200);

		const empty = await SELF.fetch("https://example.com/api/captures", {
			headers: authHeaders(),
		});
		expect(await empty.json()).toMatchObject({ captures: [] });
	});

	it("returns the original body bytes", async () => {
		const captured = await SELF.fetch("https://example.com/bin", {
			method: "PUT",
			headers: { "Content-Type": "application/octet-stream" },
			body: new Uint8Array([0, 1, 2, 255]),
		});
		const { id } = await captured.json<{ id: string }>();
		const body = await SELF.fetch(`https://example.com/api/captures/${id}/body`, {
			headers: authHeaders(),
		});
		expect(body.status).toBe(200);
		expect(new Uint8Array(await body.arrayBuffer())).toEqual(new Uint8Array([0, 1, 2, 255]));
	});

	it("purges captures older than 30 days from the scheduled handler", async () => {
		const oldId = "00000000-0000-4000-8000-000000000099";
		const oldMs = Date.now() - 31 * 24 * 60 * 60 * 1000;
		await env.BUCKET.put(`bodies/${oldId}`, "stale");
		await env.DB.prepare(
			`INSERT INTO captures (
        id, received_at, received_at_ms, method, url, path, headers_json,
        body_r2_key, body_is_binary, body_truncated, body_is_empty
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0)`,
		)
			.bind(
				oldId,
				new Date(oldMs).toISOString(),
				oldMs,
				"POST",
				"https://example.com/old",
				"/old",
				"{}",
				`bodies/${oldId}`,
			)
			.run();

		await SELF.fetch("https://example.com/fresh", { method: "POST", body: "ok" });

		await worker.scheduled(createScheduledController(), env, createExecutionContext());

		const remaining = await env.DB.prepare("SELECT id, path FROM captures ORDER BY path")
			.all<{ id: string; path: string }>();
		expect(remaining.results.map((row) => row.path)).toEqual(["/fresh"]);
		expect(await env.BUCKET.get(`bodies/${oldId}`)).toBeNull();
	});
});
