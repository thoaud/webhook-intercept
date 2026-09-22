export const INSPECTOR_CSS = `
:root {
  --bg: #12100d;
  --bg-raised: #1b1712;
  --bg-inset: #0c0b09;
  --ink: #f0e6d2;
  --muted: #9a8d76;
  --filament: #e39b2d;
  --filament-dim: #8a5410;
  --rust: #c44b2c;
  --teal: #3d8a7a;
  --steel: #6d849c;
  --olive: #8c8f3a;
  --line: rgba(240, 230, 210, 0.1);
  --font-display: "Copperplate Gothic Std", "Copperplate", "DIN Alternate", "Bahnschrift Condensed", "Arial Narrow", sans-serif;
  --font-mono: "IBM Plex Mono", "ui-monospace", "SFMono-Regular", "Menlo", "Consolas", monospace;
  --tape: 11.5rem;
}

* { box-sizing: border-box; }
html, body { margin: 0; min-height: 100%; }
html { background: var(--bg); color: var(--ink); }

body {
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.45;
  background:
    radial-gradient(1200px 500px at 12% -10%, rgba(227, 155, 45, 0.08), transparent 55%),
    linear-gradient(180deg, #17140f 0%, var(--bg) 32%);
}

body::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 80;
  opacity: 0.07;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='.9'/%3E%3C/svg%3E");
}

a { color: var(--filament); }
button, input, select { font: inherit; color: inherit; }
button { cursor: pointer; }

.login {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 2rem;
}
.login-panel {
  width: min(32rem, 100%);
  background: var(--bg-raised);
  border: 1px solid var(--line);
  padding: 2.4rem 2rem 2rem;
  position: relative;
}
.login-panel::after {
  content: "";
  position: absolute;
  left: 0;
  top: 1.1rem;
  width: 4px;
  height: 3.4rem;
  background: var(--filament);
}
.login h1 {
  font-family: var(--font-display);
  font-size: clamp(2.4rem, 6vw, 3.6rem);
  letter-spacing: 0.18em;
  margin: 0 0 0.35rem 1rem;
  font-weight: 400;
}
.login .lede {
  margin: 0 0 1.8rem 1rem;
  color: var(--muted);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-size: 0.68rem;
}
.login label {
  display: block;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  font-size: 0.68rem;
  color: var(--muted);
  margin-bottom: 0.45rem;
}
.login input[type="password"] {
  width: 100%;
  background: var(--bg-inset);
  border: 1px solid var(--line);
  padding: 0.85rem 0.9rem;
  outline: none;
}
.login input[type="password"]:focus {
  border-color: var(--filament);
}
.login button {
  margin-top: 1.2rem;
  width: 100%;
  background: var(--filament);
  color: #1a1206;
  border: 0;
  padding: 0.9rem;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  font-family: var(--font-display);
}
.login .error {
  color: var(--rust);
  margin: 0 0 1rem;
}

.top {
  display: grid;
  grid-template-columns: minmax(16rem, 1.1fr) minmax(18rem, 1fr) auto;
  gap: 1.2rem;
  align-items: end;
  padding: 1.3rem 1.5rem 1rem;
  border-bottom: 1px solid var(--line);
  position: sticky;
  top: 0;
  background: rgba(18, 16, 13, 0.92);
  z-index: 5;
}
.brand {
  display: flex;
  align-items: baseline;
  gap: 0.85rem;
}
.pip {
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 50%;
  background: var(--filament);
  box-shadow: 0 0 12px var(--filament);
  animation: pulse 2.2s ease-in-out infinite;
  translate: 0 -0.15rem;
}
.brand h1 {
  font-family: var(--font-display);
  font-size: clamp(1.6rem, 3vw, 2.3rem);
  letter-spacing: 0.22em;
  margin: 0;
  font-weight: 400;
}
.brand .tag {
  color: var(--muted);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  font-size: 0.65rem;
}
.filters {
  display: flex;
  gap: 0.7rem;
  flex-wrap: wrap;
}
.filters label {
  display: grid;
  gap: 0.3rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-size: 0.62rem;
  color: var(--muted);
}
.filters input, .filters select {
  background: var(--bg-inset);
  border: 1px solid var(--line);
  padding: 0.45rem 0.55rem;
  min-width: 8rem;
}
.actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
.ghost, .danger {
  background: transparent;
  border: 1px solid var(--line);
  padding: 0.5rem 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-size: 0.68rem;
}
.danger { color: var(--rust); border-color: rgba(196, 75, 44, 0.45); }

.bench {
  display: grid;
  grid-template-columns: minmax(22rem, 0.92fr) minmax(28rem, 1.15fr);
  min-height: calc(100vh - 5.5rem);
}
.tape {
  position: relative;
  border-right: 1px solid var(--line);
  background: linear-gradient(90deg, rgba(227,155,45,0.07) 0 0.7rem, transparent 0.7rem);
}
.tape-label {
  position: sticky;
  top: 5.5rem;
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  letter-spacing: 0.5em;
  font-family: var(--font-display);
  color: var(--filament-dim);
  font-size: 0.78rem;
  padding: 1rem 0.15rem;
  pointer-events: none;
}
#list {
  list-style: none;
  margin: -2.4rem 0 0;
  padding: 0 1rem 2rem 1.8rem;
}
#list li {
  display: grid;
  grid-template-columns: 7.2rem 4.2rem 1fr auto;
  gap: 0.55rem;
  align-items: baseline;
  padding: 0.7rem 0.6rem;
  border-bottom: 1px dashed var(--line);
  cursor: pointer;
}
#list li:hover, #list li.active {
  background: rgba(227, 155, 45, 0.08);
}
#list li.fresh { animation: arrive 0.6s ease-out; }
.when { color: var(--muted); font-variant-numeric: tabular-nums; }
.method {
  font-family: var(--font-display);
  letter-spacing: 0.08em;
  font-size: 0.78rem;
}
.method.POST { color: var(--filament); }
.method.GET { color: var(--teal); }
.method.PUT, .method.PATCH { color: var(--steel); }
.method.DELETE { color: var(--rust); }
.path { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.meta { color: var(--muted); font-size: 0.72rem; }

.detail {
  padding: 1.4rem 1.6rem 3rem;
  margin-left: -1.2rem;
  background: var(--bg-raised);
  border-left: 1px solid var(--line);
  box-shadow: -24px 0 48px rgba(0,0,0,0.25);
  min-height: 100%;
}
.watermark {
  min-height: 60vh;
  display: grid;
  place-items: center;
  color: rgba(240, 230, 210, 0.12);
  font-family: var(--font-display);
  letter-spacing: 0.28em;
  font-size: clamp(1.6rem, 4vw, 3rem);
  text-align: center;
}
.detail-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  margin-bottom: 1.2rem;
}
.detail-head h2 {
  font-family: var(--font-display);
  font-size: 1.7rem;
  letter-spacing: 0.12em;
  margin: 0 0 0.35rem;
  font-weight: 400;
  word-break: break-all;
}
.kicker {
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--muted);
  font-size: 0.66rem;
  margin: 0 0 1rem;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
  gap: 0.8rem;
  margin-bottom: 1.3rem;
}
.stat {
  border-top: 1px solid var(--line);
  padding-top: 0.45rem;
}
.stat.wide { grid-column: 1 / -1; }
.stat span {
  display: block;
  color: var(--muted);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-size: 0.62rem;
}
.stat strong {
  display: block;
  font-weight: 500;
  overflow-wrap: anywhere;
  word-break: break-all;
}
.table {
  width: 100%;
  border-collapse: collapse;
  margin: 0 0 1.4rem;
}
.table th, .table td {
  text-align: left;
  vertical-align: top;
  padding: 0.35rem 0.5rem 0.35rem 0;
  border-bottom: 1px solid var(--line);
}
.table th { color: var(--muted); font-weight: 400; letter-spacing: 0.12em; text-transform: uppercase; font-size: 0.62rem; width: 14rem; }
pre {
  background: var(--bg-inset);
  padding: 0.9rem;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
  border: 1px solid var(--line);
}
.row-actions { display: flex; flex-wrap: wrap; gap: 0.45rem; }
.toast {
  position: fixed;
  right: 1.2rem;
  bottom: 1.2rem;
  background: var(--filament);
  color: #1a1206;
  padding: 0.55rem 0.8rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  font-size: 0.7rem;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
  z-index: 90;
}
.toast.show { opacity: 1; }
.warn { color: var(--filament); }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.28; }
}
@keyframes arrive {
  from { background: rgba(227, 155, 45, 0.28); }
  to { background: transparent; }
}

@media (max-width: 980px) {
  .top, .bench { grid-template-columns: 1fr; }
  .detail { margin-left: 0; }
  #list li { grid-template-columns: 6.4rem 3.6rem 1fr; }
  .meta { display: none; }
}
`;
