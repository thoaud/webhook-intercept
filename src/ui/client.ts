export const INSPECTOR_JS = `(function () {
  var POLL_MS = 2000;
  var NL = String.fromCharCode(92, 10);
  var selectedId = null;
  var method = "";
  var knownIds = {};
  var lastItems = [];
  var dialogAction = null;
  var dialogReturn = null;
  var toastTimer = null;

  var listEl = document.getElementById("list");
  var countEl = document.getElementById("count");
  var detailEl = document.getElementById("detail");
  var chipsEl = document.getElementById("filter-method");
  var pathEl = document.getElementById("filter-path");
  var toastEl = document.getElementById("toast");
  var overlayEl = document.getElementById("overlay");
  var confirmEl = document.getElementById("dialog-confirm");
  var cancelEl = document.getElementById("dialog-cancel");

  selectedId = parseSelected();
  bindFilters();
  bindDialog();
  document.getElementById("clear-all").addEventListener("click", askClearAll);
  showSelection();
  refresh(true);
  setInterval(function () {
    if (!document.hidden) refresh(false);
  }, POLL_MS);

  function parseSelected() {
    var prefix = "/captures/";
    var p = location.pathname;
    if (p.indexOf(prefix) !== 0) return null;
    var id = p.slice(prefix.length);
    return id && id.indexOf("/") === -1 ? decodeURIComponent(id) : null;
  }

  function bindFilters() {
    chipsEl.addEventListener("click", function (e) {
      var chip = e.target.closest("[data-method]");
      if (!chip) return;
      method = chip.dataset.method;
      Array.prototype.forEach.call(chipsEl.children, function (c) {
        c.setAttribute("aria-pressed", c === chip ? "true" : "false");
      });
      refresh(true);
    });
    var debounce = null;
    pathEl.addEventListener("input", function () {
      clearTimeout(debounce);
      debounce = setTimeout(function () { refresh(true); }, 200);
    });
  }

  function filtering() {
    return !!method || !!pathEl.value.trim();
  }

  function api(path, opts) {
    return fetch(path, opts).then(function (res) {
      if (res.status === 401) {
        location.href = "/login?next=" + encodeURIComponent(location.pathname);
        throw new Error("unauthorized");
      }
      return res;
    });
  }

  function queryString() {
    var params = new URLSearchParams();
    params.set("limit", "50");
    if (method) params.set("method", method);
    if (pathEl.value.trim()) params.set("path", pathEl.value.trim());
    return params.toString();
  }

  function refresh(reset) {
    return api("/api/captures?" + queryString()).then(function (res) {
      return res.json();
    }).then(function (data) {
      renderList(data.captures || [], reset);
    }).catch(function () {});
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function badgeFor(m, selected) {
    var base = { POST: "signal", GET: "outline", PUT: "ink", PATCH: "ink", DELETE: "red" }[m] || "outline";
    if (selected && (base === "outline" || base === "ink")) return "light";
    return base;
  }

  function renderList(items, reset) {
    lastItems = items;
    var n = items.length;
    countEl.textContent = filtering()
      ? n + (n === 1 ? " match" : " matches")
      : n + (n === 1 ? " capture" : " captures");
    listEl.textContent = "";
    if (!n) {
      var empty = el("li", "tape-empty");
      empty.appendChild(el("p", "title", filtering() ? "Nothing matches." : "Nothing on the tape yet."));
      empty.appendChild(el("p", "body", filtering()
        ? "Loosen the method or path filter and it'll show up."
        : "Send anything to this host. It lands here within two seconds."));
      listEl.appendChild(empty);
      return;
    }
    var fresh = [];
    items.forEach(function (item) {
      var active = item.id === selectedId;
      var li = el("li", active ? "row active" : "row");
      li.dataset.id = item.id;
      li.tabIndex = 0;
      if (active) li.setAttribute("aria-current", "true");
      if (!reset && !knownIds[item.id]) {
        li.classList.add("fresh");
        fresh.push(li);
      }
      knownIds[item.id] = true;
      li.addEventListener("click", function () { select(item.id); });
      li.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          select(item.id);
        }
      });

      li.appendChild(el("span", "when", formatTime(item.received_at)));
      li.appendChild(el("span", "badge badge--" + badgeFor(item.method, active), item.method));
      li.appendChild(el("span", "path", item.path + (item.query ? "?" + item.query : "")));
      li.appendChild(el("span", "meta", [formatBytes(item.content_length), item.client_ip, item.country]
        .filter(Boolean)
        .join(" · ")));
      listEl.appendChild(li);
    });
    if (fresh.length) {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          fresh.forEach(function (li) { li.classList.remove("fresh"); });
        });
      });
    }
  }

  function select(id) {
    if (id === selectedId) return;
    selectedId = id;
    history.pushState({ id: id }, "", "/captures/" + encodeURIComponent(id));
    renderList(lastItems, true);
    showSelection();
  }

  function clearSelection() {
    selectedId = null;
    history.pushState({}, "", "/");
    renderList(lastItems, true);
    showSelection();
  }

  window.addEventListener("popstate", function () {
    selectedId = parseSelected();
    renderList(lastItems, true);
    showSelection();
  });

  function showSelection() {
    if (!selectedId) {
      renderAwaiting();
      return;
    }
    var id = selectedId;
    api("/api/captures/" + encodeURIComponent(id)).then(function (res) {
      if (id !== selectedId) return null;
      if (res.status === 404) {
        renderLost(id);
        return null;
      }
      return res.json();
    }).then(function (detail) {
      if (detail && detail.id === selectedId) renderDetail(detail);
    }).catch(function () {});
  }

  function heroTitle(lines) {
    var h2 = el("h2", "display");
    lines.forEach(function (line, i) {
      if (i) h2.appendChild(document.createElement("br"));
      h2.appendChild(document.createTextNode(line));
    });
    return h2;
  }

  function renderAwaiting() {
    detailEl.textContent = "";
    var wrap = el("div", "hero-state awaiting");
    wrap.appendChild(heroTitle(["All quiet.", "We're listening."]));
    var copy = el("div", "copy");
    copy.appendChild(el("p", null, "Point anything at this host. Every method, every path, we catch it. Pick a capture on the left to see what came in."));
    copy.appendChild(el("pre", "code", [
      "curl -X POST " + location.origin + "/stripe/webhook ",
      "  -H 'Content-Type: application/json' ",
      "  -d '{\\"ok\\":true}'"
    ].join(NL)));
    wrap.appendChild(copy);
    detailEl.appendChild(wrap);
  }

  function renderLost(id) {
    detailEl.textContent = "";
    var wrap = el("div", "hero-state lost");
    wrap.appendChild(heroTitle(["That one", "got away."]));
    var copy = el("div", "copy");
    var p = el("p");
    p.appendChild(document.createTextNode("Capture "));
    p.appendChild(el("span", "inline-id", id));
    p.appendChild(document.createTextNode(" is no longer on the tape. Deleted, or past the 30-day limit."));
    copy.appendChild(p);
    copy.appendChild(button("Back to the tape", "outline", "md", clearSelection));
    wrap.appendChild(copy);
    detailEl.appendChild(wrap);
  }

  function renderDetail(detail) {
    detailEl.textContent = "";
    var article = el("article", "capture");

    var head = el("div", "capture-head");
    var titles = el("div", "capture-title");
    var kicker = el("p", "kicker", detail.received_at + " · ");
    kicker.appendChild(el("span", "raw-id", detail.id));
    titles.appendChild(kicker);
    var h2 = el("h2");
    h2.appendChild(el("span", "verb", detail.method));
    h2.appendChild(document.createTextNode(" " + detail.path + (detail.query ? "?" + detail.query : "")));
    titles.appendChild(h2);
    var actions = el("div", "capture-actions");
    actions.appendChild(button("Copy as curl", "ink", "sm", function () { copyCurl(detail); }));
    if (!detail.body_is_empty) {
      var download = el("a", "btn btn--outline btn--sm", "Download body");
      download.href = "/api/captures/" + encodeURIComponent(detail.id) + "/body";
      download.addEventListener("click", function () {
        toast("Downloading " + formatBytes(detail.content_length) + ".");
      });
      actions.appendChild(download);
    }
    actions.appendChild(button("Delete", "outline", "sm", function (e) { askDelete(detail.id, e.currentTarget); }));
    head.appendChild(titles);
    head.appendChild(actions);
    article.appendChild(head);

    if (detail.body_truncated) {
      article.appendChild(el("p", "warn", "Body truncated at the configured capture cap. Download for the original bytes."));
    }

    if (detail.parsed != null) {
      article.appendChild(block("Parsed JSON", "application/json", JSON.stringify(detail.parsed, null, 2)));
    }
    if (detail.body_is_binary) {
      article.appendChild(block("Body", formatBytes(detail.content_length), "Binary payload. Download the original bytes."));
    } else if (detail.body_preview && detail.parsed == null) {
      article.appendChild(block("Body preview", detail.content_type || "", detail.body_preview));
    }

    var stats = el("div", "stats");
    [
      ["IP", detail.client_ip, false, true],
      ["Country", detail.country],
      ["Colo", detail.colo],
      ["Protocol", detail.http_protocol],
      ["Type", detail.content_type],
      ["Bytes", formatBytes(detail.content_length)],
      ["Flags", flags(detail)],
      ["SHA-256", detail.body_sha256, true, true]
    ].forEach(function (s) {
      var stat = el("div", s[2] ? "stat wide" : "stat");
      stat.appendChild(el("span", "mono-label", s[0]));
      stat.appendChild(el("strong", s[3] ? "mono" : null, s[1] || "—"));
      stats.appendChild(stat);
    });
    article.appendChild(stats);

    if (detail.query_params) table(article, "Query", detail.query_params, "pair");
    table(article, "Headers", detail.headers, "pair");
    table(article, "Cloudflare", detail.cf, "key");

    detailEl.appendChild(article);
  }

  function sectionHead(title, note) {
    var head = el("div", "section-head");
    head.appendChild(el("h3", null, title));
    head.appendChild(el("span", "mono-label", note));
    return head;
  }

  function block(title, note, text) {
    var wrap = el("div", "block");
    wrap.appendChild(sectionHead(title, note));
    wrap.appendChild(el("pre", "code", text));
    return wrap;
  }

  function table(parent, title, map, unit) {
    var keys = map ? Object.keys(map) : [];
    if (!keys.length) return;
    var wrap = el("div", "kv-table");
    wrap.appendChild(sectionHead(title, keys.length + " " + unit + (keys.length === 1 ? "" : "s")));
    keys.forEach(function (key) {
      var value = map[key];
      var row = el("div", "kv");
      row.appendChild(el("span", null, key));
      row.appendChild(el("span", null, Array.isArray(value)
        ? value.join(", ")
        : value !== null && typeof value === "object" ? JSON.stringify(value) : String(value)));
      wrap.appendChild(row);
    });
    parent.appendChild(wrap);
  }

  function button(label, variant, size, onClick) {
    var btn = el("button", "btn btn--" + variant + " btn--" + size, label);
    btn.type = "button";
    btn.addEventListener("click", onClick);
    return btn;
  }

  function flags(detail) {
    var bits = [];
    if (detail.body_is_empty) bits.push("empty");
    if (detail.body_is_binary) bits.push("binary");
    if (detail.body_truncated) bits.push("truncated");
    return bits.length ? bits.join(", ") : "none";
  }

  function skipHeader(name) {
    var n = name.toLowerCase();
    if (n.indexOf("cf-") === 0) return true;
    return [
      "host", "content-length", "connection", "transfer-encoding",
      "expect", "keep-alive", "proxy-connection", "upgrade"
    ].indexOf(n) !== -1;
  }

  function shell(value) {
    return JSON.stringify(String(value));
  }

  function copyCurl(detail) {
    var lines = ["curl -X " + shell(detail.method) + " " + shell(detail.url)];
    var headers = detail.headers || {};
    Object.keys(headers).forEach(function (name) {
      if (skipHeader(name)) return;
      var val = headers[name];
      var values = Array.isArray(val) ? val : [val];
      values.forEach(function (v) {
        lines.push("  -H " + shell(name + ": " + v));
      });
    });
    if (detail.body_preview && !detail.body_is_binary) {
      lines.push("  --data-raw " + shell(detail.body_preview));
    } else if (detail.body_is_binary) {
      lines.push("  --data-binary @capture-" + detail.id + ".bin");
    }
    var write = navigator.clipboard
      ? navigator.clipboard.writeText(lines.join(" " + NL))
      : Promise.reject(new Error("no clipboard"));
    write.then(function () {
      toast("Curl copied. Go wild.");
    }).catch(function () {
      toast("Clipboard said no. Try again.");
    });
  }

  function bindDialog() {
    confirmEl.addEventListener("click", function () {
      var action = dialogAction;
      closeDialog();
      if (action) action();
    });
    cancelEl.addEventListener("click", closeDialog);
    overlayEl.addEventListener("click", function (e) {
      if (e.target === overlayEl) closeDialog();
    });
    document.addEventListener("keydown", function (e) {
      if (overlayEl.hidden) return;
      if (e.key === "Escape") {
        closeDialog();
      } else if (e.key === "Tab") {
        e.preventDefault();
        (document.activeElement === confirmEl ? cancelEl : confirmEl).focus();
      }
    });
  }

  function openDialog(opts, trigger) {
    document.getElementById("dialog-title").textContent = opts.title;
    document.getElementById("dialog-body").textContent = opts.body;
    confirmEl.textContent = opts.confirm;
    dialogAction = opts.action;
    dialogReturn = trigger || null;
    overlayEl.hidden = false;
    confirmEl.focus();
  }

  function closeDialog() {
    overlayEl.hidden = true;
    dialogAction = null;
    if (dialogReturn && document.body.contains(dialogReturn)) dialogReturn.focus();
    dialogReturn = null;
  }

  function askDelete(id, trigger) {
    openDialog({
      title: "Drop this capture?",
      body: "The row goes, the body goes. No take-backs.",
      confirm: "Bin it",
      action: function () {
        api("/api/captures/" + encodeURIComponent(id), { method: "DELETE" }).then(function (res) {
          if (!res.ok) {
            toast("That didn't go through. Try again.");
            return;
          }
          if (selectedId === id) clearSelection();
          toast("Gone.");
          refresh(true);
        }).catch(function () {});
      }
    }, trigger);
  }

  function askClearAll(e) {
    openDialog({
      title: "Clear the whole tape?",
      body: "Every capture and every stored body, gone for good.",
      confirm: "Clear everything",
      action: function () {
        api("/api/captures", { method: "DELETE" }).then(function (res) {
          if (!res.ok) {
            toast("That didn't go through. Try again.");
            return;
          }
          knownIds = {};
          if (selectedId) clearSelection();
          toast("Tape cleared. Fresh start.");
          refresh(true);
        }).catch(function () {});
      }
    }, e.currentTarget);
  }

  function toast(message) {
    clearTimeout(toastTimer);
    toastEl.textContent = message;
    toastEl.classList.add("show");
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 1800);
  }

  function formatTime(iso) {
    var date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleTimeString([], { hour12: false }) + "." + String(date.getMilliseconds()).padStart(3, "0");
  }

  function formatBytes(n) {
    if (n == null || n === 0) return "0 B";
    if (n < 1024) return n + " B";
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
    return (n / (1024 * 1024)).toFixed(1) + " MB";
  }
})();
`;
