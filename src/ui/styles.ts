export const INSPECTOR_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Special+Gothic&family=Special+Gothic+Expanded+One&family=DM+Mono:wght@400;500&display=swap');

:root {
  --cb-green: #c9ed52;
  --cb-dark-green: #3e4e2f;
  --cb-black: #060606;
  --cb-white: #ffffff;
  --cb-blue: #4169ed;
  --cb-light-red: #ffc5bd;
  --cb-dark-red: #661b24;
  --cb-grey-1: #cfc7c7;
  --cb-grey-2: #7e7474;
  --cb-grey-3: #3a3231;
  --cb-off-white: #f8f8f9;

  --font-display: "Special Gothic", "Special Gothic Expanded One", "Arial Narrow", system-ui, sans-serif;
  --font-sans: "Special Gothic", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-mono: "DM Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace;

  --radius-xs: 4px;
  --radius-pill: 999px;
  --shadow-pop: 0 12px 40px rgba(6, 6, 6, 0.18);
  --page-margin: 30px;

  --ease-comfort: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-snug: cubic-bezier(0.34, 1.32, 0.64, 1);
  --dur-fast: 160ms;
  --dur-base: 280ms;
  --dur-slow: 520ms;
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  background: var(--cb-white);
  color: var(--cb-black);
  font-family: var(--font-sans);
}

a { color: var(--cb-black); }
a:hover { color: var(--cb-blue); }
input::placeholder { color: var(--cb-grey-2); }
:focus-visible { outline: 2px solid var(--cb-blue); outline-offset: 2px; }

@keyframes cbPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }

/* ---- Shared type ---- */

.kicker {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--cb-grey-2);
}

.raw-id { text-transform: none; }

.mono-label {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--cb-grey-2);
}

.display {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 700;
  letter-spacing: -0.02em;
  text-transform: uppercase;
  text-wrap: balance;
}

/* ---- DS: Button ---- */

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 48px;
  padding: 0 22px;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 16px;
  line-height: 1;
  letter-spacing: -0.01em;
  text-decoration: none;
  white-space: nowrap;
  border-radius: var(--radius-pill);
  cursor: pointer;
  transition: transform var(--dur-fast) var(--ease-comfort), background var(--dur-fast) var(--ease-comfort), color var(--dur-fast) var(--ease-comfort);
}
.btn:active { transform: scale(0.98); }
.btn--sm { height: 36px; padding: 0 16px; font-size: 14px; gap: 8px; }
.btn--lg { height: 58px; padding: 0 30px; font-size: 19px; gap: 12px; }
.btn--full { width: 100%; }
.btn--signal { background: var(--cb-green); color: var(--cb-black); border: 1px solid var(--cb-green); }
.btn--ink { background: var(--cb-black); color: var(--cb-white); border: 1px solid var(--cb-black); }
.btn--outline { background: transparent; color: var(--cb-black); border: 1px solid var(--cb-black); }
.btn--ghost { background: transparent; color: var(--cb-black); border: 1px solid transparent; }
.btn--ink:hover { color: var(--cb-white); }
.btn--outline:hover, .btn--ghost:hover, .btn--signal:hover { color: var(--cb-black); }

/* ---- DS: Tag ---- */

.tag {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 38px;
  padding: 0 18px;
  font-family: var(--font-display);
  font-weight: 500;
  font-size: 15px;
  letter-spacing: -0.01em;
  line-height: 1;
  cursor: pointer;
  background: transparent;
  color: var(--cb-black);
  border: 1px solid var(--cb-black);
  border-radius: var(--radius-pill);
  transition: background var(--dur-fast) var(--ease-comfort), color var(--dur-fast) var(--ease-comfort);
}
.tag[aria-pressed="true"] { background: var(--cb-black); color: var(--cb-white); }

/* ---- DS: Badge ---- */

.badge {
  display: inline-flex;
  align-items: center;
  justify-self: start;
  height: 24px;
  padding: 0 10px;
  font-family: var(--font-mono);
  font-weight: 500;
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  line-height: 1;
  white-space: nowrap;
  border: 1px solid transparent;
  border-radius: var(--radius-pill);
}
.badge--signal { background: var(--cb-green); color: var(--cb-black); }
.badge--ink { background: var(--cb-black); color: var(--cb-white); }
.badge--outline { background: transparent; color: var(--cb-black); border-color: var(--cb-black); }
.badge--red { background: var(--cb-dark-red); color: var(--cb-white); }
.badge--light { background: var(--cb-white); color: var(--cb-black); }

/* ---- DS: Input (line variant) ---- */

.field { display: block; }
.field-label {
  display: block;
  margin-bottom: 8px;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--cb-grey-2);
}
.field input {
  width: 100%;
  padding: 10px 0;
  font-family: var(--font-sans);
  font-weight: 400;
  font-size: 16px;
  line-height: 1.2;
  color: var(--cb-black);
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--cb-black);
  border-radius: 0;
  outline: none;
}
.field input:focus-visible { border-bottom-color: var(--cb-blue); box-shadow: 0 1px 0 var(--cb-blue); }

.two-dots { display: block; flex: none; }

/* ---- Login ---- */

.login {
  min-height: 100vh;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr));
}
.login-hero {
  background: var(--cb-dark-green);
  color: var(--cb-white);
  padding: var(--page-margin);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 64px;
  min-height: 360px;
}
.login-hero h1 { font-size: clamp(56px, 8.5vw, 120px); line-height: 0.82; }
.login-hero .kicker { color: var(--cb-green); }
.login-side { display: grid; place-items: center; padding: 48px var(--page-margin); }
.login-form { width: 100%; max-width: 400px; display: flex; flex-direction: column; gap: 24px; }
.login-intro { display: flex; flex-direction: column; gap: 12px; }
.login-intro h2 { font-size: 44px; line-height: 0.85; }
.login-intro .lede { margin: 0; font-size: 16px; line-height: 1.2; color: var(--cb-grey-2); }
.login-error { margin: -8px 0 0; font-size: 14px; line-height: 1.2; color: var(--cb-dark-red); }

/* ---- Inspector shell ---- */

.inspector { height: 100vh; display: flex; flex-direction: column; }

.top {
  display: flex;
  align-items: center;
  gap: 16px;
  height: 52px;
  padding: 0 var(--page-margin);
  border-bottom: 1px solid var(--cb-black);
  background: var(--cb-white);
}
.top h1 { font-size: 22px; line-height: 0.9; }
.status { display: flex; align-items: center; gap: 8px; margin-left: 8px; min-width: 0; }
.status span:last-child { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pip {
  display: inline-block;
  flex: none;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--cb-green);
  box-shadow: 0 0 0 3px rgba(201, 237, 82, 0.35);
  animation: cbPulse 2.2s ease-in-out infinite;
}
.pip.paused { background: var(--cb-grey-1); box-shadow: none; animation: none; }
.top-actions { display: flex; align-items: center; gap: 4px; margin-left: auto; }
.top-actions form { margin: 0; }

#bench {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(340px, 2fr) minmax(0, 3fr);
}

/* ---- Tape (list) ---- */

.tape { min-height: 0; overflow: auto; border-right: 1px solid var(--cb-black); }
.filters {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px var(--page-margin) 12px;
  border-bottom: 1px solid var(--cb-black);
}
.chips { display: flex; flex-wrap: wrap; gap: 6px; }
.tape-bar {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 10px var(--page-margin) 8px;
  border-bottom: 1px solid var(--cb-grey-1);
}
#list { list-style: none; margin: 0; padding: 0; }

.row {
  display: grid;
  grid-template-columns: 96px 78px minmax(0, 1fr);
  column-gap: 12px;
  row-gap: 6px;
  align-items: center;
  padding: 14px var(--page-margin);
  border-bottom: 1px solid var(--cb-grey-1);
  cursor: pointer;
  color: var(--cb-black);
  transition: background var(--dur-fast) var(--ease-comfort), color var(--dur-fast) var(--ease-comfort), opacity var(--dur-slow) var(--ease-comfort), transform var(--dur-slow) var(--ease-snug);
}
.row:hover { background: var(--cb-off-white); }
.row.active, .row.active:hover { background: var(--cb-black); color: var(--cb-white); }
.row.fresh { opacity: 0; transform: translateY(-10px); }
.row .when { font-family: var(--font-mono); font-size: 12px; font-variant-numeric: tabular-nums; color: var(--cb-grey-2); }
.row .path { font-size: 15px; font-weight: 500; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
.row .meta {
  grid-column: 3;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.02em;
  color: var(--cb-grey-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.row.active .when, .row.active .meta { color: var(--cb-grey-1); }

.tape-empty { padding: 48px var(--page-margin); display: flex; flex-direction: column; gap: 12px; }
.tape-empty .title { margin: 0; font-family: var(--font-display); font-weight: 700; font-size: 22px; line-height: 0.9; letter-spacing: -0.01em; text-transform: uppercase; }
.tape-empty .body { margin: 0; font-size: 15px; line-height: 1.25; color: var(--cb-grey-2); }

/* ---- Detail ---- */

.detail { min-height: 0; overflow: auto; padding: var(--page-margin); }

.hero-state {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 32px;
  max-width: 720px;
}
.hero-state h2 { font-size: clamp(44px, 6vw, 88px); line-height: 0.82; }
.hero-state.awaiting h2 { color: var(--cb-grey-2); }
.hero-state .copy { display: flex; flex-direction: column; gap: 12px; align-items: flex-start; }
.hero-state.lost .copy { gap: 20px; }
.hero-state p { margin: 0; font-size: 16px; line-height: 1.25; max-width: 520px; }
.hero-state .inline-id { font-family: var(--font-mono); font-size: 14px; }
.hero-state pre { align-self: stretch; }

pre.code {
  margin: 0;
  padding: 16px 18px;
  background: var(--cb-off-white);
  border: 1px solid var(--cb-grey-1);
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}
.block pre.code { max-height: 420px; overflow: auto; }

.capture { display: flex; flex-direction: column; gap: 28px; max-width: 1080px; }
.capture-head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px 32px;
}
.capture-title { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
.capture-title h2 {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(30px, 3.4vw, 44px);
  line-height: 0.88;
  letter-spacing: -0.02em;
  overflow-wrap: anywhere;
}
.capture-title h2 .verb { text-transform: uppercase; }
.capture-actions { display: flex; flex-wrap: wrap; gap: 8px; }

.warn { margin: 0; padding: 12px 16px; background: var(--cb-light-red); font-size: 14px; line-height: 1.2; }

.block { display: flex; flex-direction: column; gap: 12px; }
.section-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--cb-black);
}
.section-head h3 { margin: 0; font-family: var(--font-display); font-weight: 700; font-size: 16px; line-height: 0.9; text-transform: uppercase; }

.stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 20px 16px; }
.stat { border-top: 1px solid var(--cb-black); padding-top: 8px; display: flex; flex-direction: column; gap: 4px; }
.stat.wide { grid-column: 1 / -1; }
.stat strong { font-weight: 500; font-size: 15px; line-height: 1.2; overflow-wrap: anywhere; }
.stat strong.mono { font-family: var(--font-mono); }

.kv-table { display: flex; flex-direction: column; }
.kv {
  display: grid;
  grid-template-columns: minmax(120px, 220px) minmax(0, 1fr);
  gap: 16px;
  padding: 9px 0;
  border-bottom: 1px solid var(--cb-grey-1);
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.4;
}
.kv span { overflow-wrap: anywhere; }
.kv span:first-child { color: var(--cb-grey-2); }

/* ---- Dialog ---- */

.overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(6, 6, 6, 0.55);
}
.overlay[hidden] { display: none; }
.dialog {
  width: 100%;
  max-width: 460px;
  background: var(--cb-white);
  padding: var(--page-margin);
  display: flex;
  flex-direction: column;
  gap: 24px;
  box-shadow: var(--shadow-pop);
}
.dialog-copy { display: flex; flex-direction: column; gap: 12px; }
.dialog h3 { font-size: 34px; line-height: 0.85; }
.dialog p { margin: 0; font-size: 16px; line-height: 1.25; color: var(--cb-grey-3); }
.dialog-actions { display: flex; flex-wrap: wrap; gap: 8px; }

/* ---- Toast ---- */

.toast {
  position: fixed;
  right: var(--page-margin);
  bottom: var(--page-margin);
  z-index: 60;
  pointer-events: none;
  background: var(--cb-black);
  color: var(--cb-white);
  padding: 12px 18px;
  font-family: var(--font-mono);
  font-size: 13px;
  letter-spacing: 0.02em;
  opacity: 0;
  transform: translateY(12px);
  transition: opacity var(--dur-base) var(--ease-comfort), transform var(--dur-base) var(--ease-comfort);
}
.toast.show { opacity: 1; transform: translateY(0); }

@media (max-width: 860px) {
  #bench { grid-template-columns: minmax(0, 1fr); grid-template-rows: minmax(0, 45%) minmax(0, 1fr); }
  .tape { border-right: none; border-bottom: 1px solid var(--cb-black); }
}

@media (max-width: 560px) {
  :root { --page-margin: 16px; }
  .status { display: none; }
  .row { grid-template-columns: 78px 64px minmax(0, 1fr); }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition: none !important; animation: none !important; }
}
`;
