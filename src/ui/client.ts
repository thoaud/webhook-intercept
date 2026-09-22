export const INSPECTOR_JS = `(function () {
  var POLL_MS = 2000;
  var selectedId = null;
  var knownIds = {};
  var timer = null;

  var listEl = document.getElementById("list");
  var detailEl = document.getElementById("detail");
  var methodEl = document.getElementById("filter-method");
  var pathEl = document.getElementById("filter-path");
  var toastEl = document.getElementById("toast");

  selectedId = parseSelected();
  bindFilters();
  document.getElementById("clear-all").addEventListener("click", clearAll);
  refresh(true);
  timer = setInterval(function () {
    if (!document.hidden) refresh(false);
  }, POLL_MS);

  function parseSelected() {
    var match = location.pathname.match(/^\\/captures\\/([^/]+)$/);
    return match ? match[1] : null;
  }

  function bindFilters() {
    methodEl.addEventListener("change", function () { refresh(true); });
    var debounce = null;
    pathEl.addEventListener("input", function () {
      clearTimeout(debounce);
      debounce = setTimeout(function () { refresh(true); }, 200);
    });
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
    if (methodEl.value) params.set("method", methodEl.value);
    if (pathEl.value.trim()) params.set("path", pathEl.value.trim());
    return params.toString();
  }

  function refresh(reset) {
    return api("/api/captures?" + queryString()).then(function (res) {
      return res.json();
    }).then(function (data) {
      renderList(data.captures || [], reset);
      if (selectedId) loadDetail(selectedId);
    }).catch(function () {});
  }

  function renderList(items, reset) {
    listEl.textContent = "";
    if (!items.length) {
      var empty = document.createElement("li");
      empty.textContent = "Waiting on the wire…";
      empty.style.color = "var(--muted)";
      listEl.appendChild(empty);
      return;
    }
    items.forEach(function (item) {
      var li = document.createElement("li");
      li.dataset.id = item.id;
      if (item.id === selectedId) li.className = "active";
      if (!reset && !knownIds[item.id]) li.classList.add("fresh");
      knownIds[item.id] = true;
      li.addEventListener("click", function () { select(item.id); });

      var when = document.createElement("span");
      when.className = "when";
      when.textContent = formatTime(item.received_at);

      var method = document.createElement("span");
      method.className = "method " + item.method;
      method.textContent = item.method;

      var path = document.createElement("span");
      path.className = "path";
      path.textContent = item.path + (item.query ? "?" + item.query : "");

      var meta = document.createElement("span");
      meta.className = "meta";
      meta.textContent = [formatBytes(item.content_length), item.client_ip, item.country]
        .filter(Boolean)
        .join(" · ");

      li.appendChild(when);
      li.appendChild(method);
      li.appendChild(path);
      li.appendChild(meta);
      listEl.appendChild(li);
    });
  }

  function select(id) {
    selectedId = id;
    history.pushState({ id: id }, "", "/captures/" + id);
    Array.prototype.forEach.call(listEl.children, function (li) {
      li.classList.toggle("active", li.dataset.id === id);
    });
    loadDetail(id);
    refresh(true);
  }

  window.addEventListener("popstate", function () {
    selectedId = parseSelected();
    refresh(true);
  });

  function loadDetail(id) {
    api("/api/captures/" + encodeURIComponent(id)).then(function (res) {
      if (res.status === 404) {
        renderMissing();
        return null;
      }
      return res.json();
    }).then(function (detail) {
      if (detail) renderDetail(detail);
    }).catch(function () {});
  }

  function renderMissing() {
    detailEl.textContent = "";
    var mark = document.createElement("div");
    mark.className = "watermark";
    mark.textContent = "SIGNAL LOST";
    detailEl.appendChild(mark);
  }

  function renderDetail(detail) {
    detailEl.textContent = "";

    var head = document.createElement("div");
    head.className = "detail-head";
    var titles = document.createElement("div");
    var kicker = document.createElement("p");
    kicker.className = "kicker";
    kicker.textContent = detail.received_at + "  ·  " + detail.id;
    var h2 = document.createElement("h2");
    h2.textContent = detail.method + "  " + detail.path;
    titles.appendChild(kicker);
    titles.appendChild(h2);
    var actions = document.createElement("div");
    actions.className = "row-actions";
    actions.appendChild(actionButton("Copy as curl", function () { copyCurl(detail); }));
    if (!detail.body_is_empty) {
      var download = document.createElement("a");
      download.className = "ghost";
      download.textContent = "Download body";
      download.href = "/api/captures/" + encodeURIComponent(detail.id) + "/body";
      actions.appendChild(download);
    }
    actions.appendChild(actionButton("Delete", function () { removeOne(detail.id); }, true));
    head.appendChild(titles);
    head.appendChild(actions);
    detailEl.appendChild(head);

    var grid = document.createElement("div");
    grid.className = "grid";
    [
      ["IP", detail.client_ip],
      ["Country", detail.country],
      ["Colo", detail.colo],
      ["Protocol", detail.http_protocol],
      ["Type", detail.content_type],
      ["Bytes", formatBytes(detail.content_length)],
      ["Flags", flags(detail)],
      ["SHA-256", detail.body_sha256, "wide"]
    ].forEach(function (pair) {
      var stat = document.createElement("div");
      stat.className = pair[2] ? "stat " + pair[2] : "stat";
      var label = document.createElement("span");
      label.textContent = pair[0];
      var value = document.createElement("strong");
      value.textContent = pair[1] || "—";
      stat.appendChild(label);
      stat.appendChild(value);
      grid.appendChild(stat);
    });
    detailEl.appendChild(grid);

    if (detail.body_truncated) {
      var warn = document.createElement("p");
      warn.className = "warn";
      warn.textContent = "Body truncated at the configured capture cap.";
      detailEl.appendChild(warn);
    }

    section("Query", renderMap(detail.query_params));
    section("Headers", renderMap(detail.headers));
    if (detail.parsed != null) {
      section("Parsed JSON", renderPre(JSON.stringify(detail.parsed, null, 2)));
    }
    if (detail.body_is_binary) {
      section("Body", renderNote("Binary payload — download the original bytes."));
    } else if (detail.body_preview) {
      section("Body preview", renderPre(detail.body_preview));
    }
    section("Cloudflare", renderMap(detail.cf));
  }

  function section(title, node) {
    if (!node) return;
    var h = document.createElement("p");
    h.className = "kicker";
    h.textContent = title;
    detailEl.appendChild(h);
    detailEl.appendChild(node);
  }

  function renderMap(map) {
    if (!map || (typeof map === "object" && !Object.keys(map).length)) return null;
    var table = document.createElement("table");
    table.className = "table";
    Object.keys(map).forEach(function (key) {
      var tr = document.createElement("tr");
      var th = document.createElement("th");
      th.textContent = key;
      var td = document.createElement("td");
      var value = map[key];
      td.textContent = Array.isArray(value) ? value.join(", ") : String(value);
      tr.appendChild(th);
      tr.appendChild(td);
      table.appendChild(tr);
    });
    return table;
  }

  function renderPre(text) {
    var pre = document.createElement("pre");
    pre.textContent = text;
    return pre;
  }

  function renderNote(text) {
    var p = document.createElement("p");
    p.textContent = text;
    p.style.color = "var(--muted)";
    return p;
  }

  function actionButton(label, onClick, danger) {
    var btn = document.createElement("button");
    btn.className = danger ? "danger" : "ghost";
    btn.type = "button";
    btn.textContent = label;
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
    navigator.clipboard.writeText(lines.join(" " + String.fromCharCode(92, 10))).then(function () {
      toast("Copied curl");
    }).catch(function () {
      toast("Clipboard blocked");
    });
  }

  function removeOne(id) {
    if (!confirm("Delete this capture?")) return;
    api("/api/captures/" + encodeURIComponent(id), { method: "DELETE" }).then(function (res) {
      if (!res.ok) return;
      if (selectedId === id) {
        selectedId = null;
        history.pushState({}, "", "/");
        detailEl.innerHTML = '<div class="watermark">AWAITING SIGNAL</div>';
      }
      refresh(true);
    });
  }

  function clearAll() {
    if (!confirm("Destroy all captured payloads?")) return;
    api("/api/captures", { method: "DELETE" }).then(function () {
      selectedId = null;
      history.pushState({}, "", "/");
      detailEl.innerHTML = '<div class="watermark">AWAITING SIGNAL</div>';
      knownIds = {};
      refresh(true);
    });
  }

  function toast(message) {
    toastEl.textContent = message;
    toastEl.classList.add("show");
    setTimeout(function () { toastEl.classList.remove("show"); }, 1400);
  }

  function formatTime(iso) {
    var date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleTimeString([], { hour12: false }) + "." + String(date.getMilliseconds()).padStart(3, "0");
  }

  function formatBytes(n) {
    if (n == null) return "";
    if (n < 1024) return n + " B";
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
    return (n / (1024 * 1024)).toFixed(1) + " MB";
  }
})();
`;
