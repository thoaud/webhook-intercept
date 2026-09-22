import { Hono } from "hono";
import type { Context, Next } from "hono";
import { deleteCookie, setCookie } from "hono/cookie";
import {
	COOKIE_MAX_AGE,
	COOKIE_NAME,
	isAuthorized,
	safeNextPath,
	tokensMatch,
} from "./auth";
import { bodyMaxBytes, snapshotRequest } from "./capture";
import { purgeExpiredCaptures } from "./cleanup";
import {
	deleteAllCaptures,
	deleteCapture,
	getCapture,
	getCaptureBody,
	listCaptures,
	persistCapture,
} from "./store";
import { inspectorPage, loginPage } from "./ui/html";

type AppEnv = { Bindings: Env };

const app = new Hono<AppEnv>();

app.onError((err, c) => {
	console.error({ msg: "unhandled_error", error: err.message });
	if (c.req.path.startsWith("/api/")) {
		return c.json({ error: "internal" }, 500);
	}
	return c.json({ ok: false, error: "internal" }, 500);
});

app.get("/login", async (c) => {
	if (await isAuthorized(c.req.raw, c.env.INSPECT_TOKEN)) {
		return c.redirect(safeNextPath(c.req.query("next")));
	}
	return c.html(loginPage({ error: null, next: safeNextPath(c.req.query("next")) }));
});

app.post("/login", async (c) => {
	const body = await c.req.parseBody();
	const token = typeof body.token === "string" ? body.token : "";
	const next = safeNextPath(typeof body.next === "string" ? body.next : c.req.query("next"));
	const ok = await tokensMatch(token, c.env.INSPECT_TOKEN);
	if (!ok) {
		console.log({ msg: "login_failed" });
		return c.html(loginPage({ error: "Token rejected.", next }), 401);
	}
	const secure = new URL(c.req.url).protocol === "https:";
	setCookie(c, COOKIE_NAME, token, {
		httpOnly: true,
		path: "/",
		sameSite: "Lax",
		maxAge: COOKIE_MAX_AGE,
		...(secure ? { secure: true } : {}),
	});
	return c.redirect(next);
});

app.get("/logout", (c) => {
	clearSession(c);
	return c.redirect("/login");
});

app.post("/logout", (c) => {
	clearSession(c);
	return c.redirect("/login");
});

app.all("/favicon.ico", () => new Response(null, { status: 204 }));
app.all("/robots.txt", () => new Response("User-agent: *\nDisallow: /\n", {
	headers: { "Content-Type": "text/plain; charset=utf-8" },
}));

app.get("/", requireInspectAuth, (c) => c.html(inspectorPage()));
app.get("/captures/:id", requireInspectAuth, (c) => c.html(inspectorPage()));

app.get("/api/captures", requireInspectAuth, async (c) => {
	const limitRaw = Number(c.req.query("limit") ?? "50");
	const result = await listCaptures(c.env, {
		limit: Number.isFinite(limitRaw) ? limitRaw : 50,
		cursor: c.req.query("cursor") ?? null,
		method: c.req.query("method") ?? null,
		path: c.req.query("path") ?? null,
	});
	return c.json(result);
});

app.delete("/api/captures", requireInspectAuth, async (c) => {
	const deleted = await deleteAllCaptures(c.env);
	return c.json({ ok: true, deleted });
});

app.get("/api/captures/:id/body", requireInspectAuth, async (c) => {
	const id = c.req.param("id");
	if (!id) {
		return c.json({ error: "not_found" }, 404);
	}
	const payload = await getCaptureBody(c.env, id);
	if (payload == null) {
		return c.json({ error: "not_found" }, 404);
	}
	const contentType = payload.contentType ?? "application/octet-stream";
	return new Response(payload.body, {
		headers: {
			"Content-Type": contentType,
			"Content-Disposition": `attachment; filename="capture-${id}${extensionFor(contentType)}"`,
		},
	});
});

app.get("/api/captures/:id", requireInspectAuth, async (c) => {
	const id = c.req.param("id");
	if (!id) {
		return c.json({ error: "not_found" }, 404);
	}
	const detail = await getCapture(c.env, id);
	if (detail == null) {
		return c.json({ error: "not_found" }, 404);
	}
	return c.json(detail);
});

app.delete("/api/captures/:id", requireInspectAuth, async (c) => {
	const id = c.req.param("id");
	if (!id) {
		return c.json({ error: "not_found" }, 404);
	}
	const deleted = await deleteCapture(c.env, id);
	if (!deleted) {
		return c.json({ error: "not_found" }, 404);
	}
	return c.json({ ok: true });
});

app.all("*", async (c) => {
	const snapshot = await snapshotRequest(c.req.raw, bodyMaxBytes(c.env));
	await persistCapture(c.env, snapshot);
	console.log({
		msg: "captured",
		id: snapshot.id,
		method: snapshot.method,
		path: snapshot.path,
		bytes: snapshot.contentLength,
		truncated: snapshot.bodyTruncated,
	});
	return c.json({ ok: true, id: snapshot.id });
});

async function requireInspectAuth(c: Context<AppEnv>, next: Next) {
	const ok = await isAuthorized(c.req.raw, c.env.INSPECT_TOKEN);
	if (!ok) {
		if (c.req.path.startsWith("/api/")) {
			return c.json({ error: "unauthorized" }, 401);
		}
		return c.redirect(`/login?next=${encodeURIComponent(c.req.path)}`);
	}
	await next();
}

function clearSession(c: Context<AppEnv>): void {
	deleteCookie(c, COOKIE_NAME, { path: "/" });
}

function extensionFor(contentType: string): string {
	if (contentType.includes("json")) {
		return ".json";
	}
	if (contentType.startsWith("text/")) {
		return ".txt";
	}
	return ".bin";
}

const worker = {
	fetch: app.fetch,
	async scheduled(_controller: ScheduledController, env: Env, _ctx: ExecutionContext) {
		await purgeExpiredCaptures(env);
	},
} satisfies ExportedHandler<Env>;

export default worker;
