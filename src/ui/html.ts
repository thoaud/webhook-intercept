import { INSPECTOR_JS } from "./client";
import { INSPECTOR_CSS } from "./styles";

export function loginPage(input: { error: string | null; next: string }): string {
	const error = input.error
		? `<p class="error">${escapeHtml(input.error)}</p>`
		: "";
	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Authenticate — Intercept</title>
  <style>${INSPECTOR_CSS}</style>
</head>
<body>
  <main class="login">
    <form class="login-panel" method="post" action="/login">
      <h1>INTERCEPT</h1>
      <p class="lede">Webhook capture bench</p>
      ${error}
      <label for="token">Inspect token</label>
      <input id="token" name="token" type="password" autocomplete="current-password" required autofocus>
      <input type="hidden" name="next" value="${escapeHtml(input.next)}">
      <button type="submit">Authenticate</button>
    </form>
  </main>
</body>
</html>`;
}

export function inspectorPage(): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Intercept — webhook capture</title>
  <style>${INSPECTOR_CSS}</style>
</head>
<body>
  <header class="top">
    <div class="brand">
      <span class="pip" aria-hidden="true"></span>
      <h1>INTERCEPT</h1>
      <p class="tag">live tape</p>
    </div>
    <form class="filters" id="filters" action="javascript:void(0)">
      <label>Method
        <select id="filter-method">
          <option value="">Any</option>
          <option>GET</option>
          <option>POST</option>
          <option>PUT</option>
          <option>PATCH</option>
          <option>DELETE</option>
          <option>HEAD</option>
          <option>OPTIONS</option>
        </select>
      </label>
      <label>Path prefix
        <input id="filter-path" type="text" placeholder="/stripe" spellcheck="false">
      </label>
    </form>
    <div class="actions">
      <button class="danger" type="button" id="clear-all">Clear all</button>
      <form method="post" action="/logout">
        <button class="ghost" type="submit">Sign out</button>
      </form>
    </div>
  </header>
  <div class="bench">
    <aside class="tape">
      <div class="tape-label">RECEIVED</div>
      <ol id="list"></ol>
    </aside>
    <section class="detail" id="detail">
      <div class="watermark">AWAITING SIGNAL</div>
    </section>
  </div>
  <div class="toast" id="toast"></div>
  <script>${INSPECTOR_JS}</script>
</body>
</html>`;
}

function escapeHtml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}
