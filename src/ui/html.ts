import { INSPECTOR_JS } from "./client";
import { INSPECTOR_CSS } from "./styles";

export function loginPage(input: { error: string | null; next: string }): string {
	const error = input.error
		? `<p class="login-error" role="alert">${escapeHtml(input.error)}</p>`
		: "";
	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Sign in — Intercept</title>
  <style>${INSPECTOR_CSS}</style>
</head>
<body>
  <main class="login">
    <div class="login-hero">
      ${twoDots(48, "var(--cb-green)")}
      <h1 class="display">Your hooks.<br>Our business.</h1>
      <p class="kicker">Intercept · Webhook capture bench</p>
    </div>
    <div class="login-side">
      <form class="login-form" method="post" action="/login">
        <div class="login-intro">
          <p class="kicker">Sign in</p>
          <h2 class="display">Show us your token</h2>
          <p class="lede">Inspection is private. Capturing is not. Paste the inspect token and we'll let you at the tape.</p>
        </div>
        <label class="field" for="token">
          <span class="field-label">Inspect token</span>
          <input id="token" name="token" type="password" placeholder="••••••••••••••••" autocomplete="current-password" required autofocus>
        </label>
        ${error}
        <input type="hidden" name="next" value="${escapeHtml(input.next)}">
        <button class="btn btn--signal btn--lg btn--full" type="submit">Let me in</button>
      </form>
    </div>
  </main>
</body>
</html>`;
}

export function inspectorPage(): string {
	const methods = ["", "GET", "POST", "PUT", "PATCH", "DELETE"]
		.map(
			(m) =>
				`<button class="tag" type="button" data-method="${m}" aria-pressed="${m === "" ? "true" : "false"}">${m || "Any"}</button>`,
		)
		.join("");
	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Intercept — webhook capture</title>
  <style>${INSPECTOR_CSS}</style>
</head>
<body>
  <div class="inspector">
    <header class="top">
      ${twoDots(30, "var(--cb-black)")}
      <h1 class="display">Intercept</h1>
      <div class="status">
        <span class="pip" id="pip" aria-hidden="true"></span>
        <span class="mono-label" id="pip-label">Listening · polls every 2s</span>
      </div>
      <div class="top-actions">
        <button class="btn btn--ghost btn--sm" type="button" id="clear-all">Clear all</button>
        <form method="post" action="/logout">
          <button class="btn btn--outline btn--sm" type="submit">Sign out</button>
        </form>
      </div>
    </header>
    <div id="bench">
      <aside class="tape">
        <div class="filters">
          <div class="chips" id="filter-method" role="group" aria-label="Method">${methods}</div>
          <label class="field">
            <input id="filter-path" type="text" placeholder="Path prefix, e.g. /stripe" spellcheck="false" aria-label="Path prefix">
          </label>
        </div>
        <div class="tape-bar mono-label">
          <span>Received</span>
          <span id="count"></span>
        </div>
        <ol id="list"></ol>
      </aside>
      <section class="detail" id="detail"></section>
    </div>
  </div>
  <div class="overlay" id="overlay" hidden>
    <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      ${twoDots(32, "var(--cb-black)")}
      <div class="dialog-copy">
        <h3 class="display" id="dialog-title"></h3>
        <p id="dialog-body"></p>
      </div>
      <div class="dialog-actions">
        <button class="btn btn--ink" type="button" id="dialog-confirm"></button>
        <button class="btn btn--outline" type="button" id="dialog-cancel">Keep it</button>
      </div>
    </div>
  </div>
  <div class="toast" id="toast" aria-live="polite"></div>
  <script>${INSPECTOR_JS}</script>
</body>
</html>`;
}

function twoDots(size: number, color: string): string {
	return `<svg class="two-dots" role="img" aria-label="Comfyballs" width="${size}" height="${Math.round((size * 20) / 44)}" viewBox="0 0 44 20" fill="${color}"><path d="M 10.674 20 L 10.032 20 C 4.491 20 0 15.523 0 10 C 0 4.477 4.491 0 10.032 0 L 10.674 0 C 16.214 0 20.706 4.477 20.706 10 C 20.706 15.523 16.214 20 10.674 20 Z M 44 10 C 44 4.477 39.509 0 33.968 0 L 33.326 0 C 27.786 0 23.294 4.477 23.294 10 C 23.294 15.523 27.786 20 33.326 20 L 33.968 20 C 39.509 20 44 15.523 44 10 Z"/></svg>`;
}

function escapeHtml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}
