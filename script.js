/* ==========================================================================
   José Martín · Portfolio · script.js
   ========================================================================== */
(function () {
  "use strict";

  /* ---------- Configuración ---------- */
  // Sustituye TU_ID por el ID de tu formulario de Formspree (p. ej. "xyzabcd").
  var FORMSPREE_ENDPOINT = "https://formspree.io/f/TU_ID";

  var I18N = window.I18N;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var state = { lang: "es", filter: "all", alexa: { type: "locale", key: "es-ES" }, mapActive: null };

  /* ---------- Utilidades ---------- */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function store(key, val) {
    try { if (val === undefined) return localStorage.getItem(key); localStorage.setItem(key, val); } catch (e) { return null; }
  }
  function esc(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  // Escapa el texto y resalta los marcadores [AÑADIR: ...] / [ADD: ...]
  function fmt(str) {
    return esc(str).replace(/\[(AÑADIR|ADD):[^\]]*\]/g, function (m) { return '<span class="todo">' + m + "</span>"; });
  }
  function L() { return I18N[state.lang]; }
  function t(key) { var v = L().ui[key]; return v === undefined ? key : v; }

  /* ---------- i18n ---------- */
  function applyStatic() {
    $$("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (/\.body$/.test(key)) el.innerHTML = t(key);   // HTML de confianza (política de privacidad)
      else el.innerHTML = fmt(t(key));
    });
    $$("[data-i18n-attr]").forEach(function (el) {
      el.getAttribute("data-i18n-attr").split(";").forEach(function (pair) {
        var p = pair.split(":");
        if (p.length === 2) el.setAttribute(p[0].trim(), t(p[1].trim()));
      });
    });
    document.documentElement.lang = state.lang;
    document.title = t("meta.title");
    var md = $('meta[name="description"]');
    if (md) md.setAttribute("content", t("meta.description"));
    $("#map-svg-title").textContent = t("map.title");
    $$(".lang__btn").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.lang === state.lang)); });
  }

  function setLang(lang) {
    if (!I18N[lang]) return;
    state.lang = lang;
    store("jm-lang", lang);
    applyStatic();
    renderAlexa();
    renderFilters();
    renderProjects();
    renderMap();
    renderTimeline();
    renderSkills();
    observeReveal();
  }

  /* ---------- Tema ---------- */
  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    var meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "light" ? "#FAFAF7" : "#0E0E10");
    store("jm-theme", theme);
  }

  /* ---------- Navegación ---------- */
  function initNav() {
    var nav = $("#nav"), burger = $("#nav-burger"), links = $("#nav-links");

    function onScroll() { nav.classList.toggle("is-scrolled", window.scrollY > 10); }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    function closeMenu() {
      links.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
      burger.innerHTML = '<i class="fa-solid fa-bars" aria-hidden="true"></i>';
    }
    burger.addEventListener("click", function () {
      var open = !links.classList.contains("is-open");
      links.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", String(open));
      burger.innerHTML = '<i class="fa-solid fa-' + (open ? "xmark" : "bars") + '" aria-hidden="true"></i>';
      if (open) { var first = $("a", links); if (first) first.focus(); }
    });
    $$("a", links).forEach(function (a) { a.addEventListener("click", closeMenu); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && links.classList.contains("is-open")) { closeMenu(); burger.focus(); }
    });
    window.addEventListener("resize", function () { if (window.innerWidth > 1060) closeMenu(); });

    // Enlace activo según la sección visible
    var map = {};
    $$("a", links).forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var id = en.target.id === "reconocimientos" ? "mapa" : en.target.id;
          $$("a", links).forEach(function (a) { a.classList.remove("is-active"); a.removeAttribute("aria-current"); });
          if (map[id]) { map[id].classList.add("is-active"); map[id].setAttribute("aria-current", "true"); }
        });
      }, { rootMargin: "-45% 0px -50% 0px" });
      $$("main section[id]").forEach(function (s) { io.observe(s); });
    }
  }

  /* ---------- Animaciones al hacer scroll ---------- */
  var revealIO = null;
  function observeReveal() {
    var els = $$(".reveal:not(.is-visible)");
    if (reduceMotion || !("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("is-visible"); });
      fillBars();
      return;
    }
    if (!revealIO) {
      revealIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          en.target.classList.add("is-visible");
          if (en.target.classList.contains("langs")) fillBars();
          revealIO.unobserve(en.target);
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    }
    els.forEach(function (el) { revealIO.observe(el); });
    if ($(".langs.is-visible")) fillBars();
  }
  function fillBars() {
    $$(".bar__fill").forEach(function (b) { b.style.width = b.dataset.pct + "%"; });
  }

  /* ---------- Contadores ---------- */
  function initCounters() {
    var counters = $$(".count");
    function run(el) {
      var from = +el.dataset.from, to = +el.dataset.to;
      if (reduceMotion) { el.textContent = to; return; }
      var dur = 1400, start = null;
      function step(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(from + (to - from) * eased);
        if (p < 1) requestAnimationFrame(step);
      }
      el.textContent = from;
      requestAnimationFrame(step);
    }
    if (!("IntersectionObserver" in window) || reduceMotion) { counters.forEach(function (c) { c.textContent = c.dataset.to; }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { c.textContent = c.dataset.from; io.observe(c); });
  }

  /* ---------- Alexa showcase ---------- */
  var DOMAIN_ICONS = { automotive: "fa-car", music: "fa-music", home: "fa-house-signal", video: "fa-film", others: "fa-ellipsis" };
  var LOCALE_FLAGS = { "es-ES": "es", "es-MX": "mx", "es-US": "us" };

  function renderAlexa() {
    var a = L().alexa;
    var locWrap = $("#alexa-locales"), domWrap = $("#alexa-domains");

    locWrap.innerHTML = Object.keys(a.locales).map(function (code) {
      var on = state.alexa.type === "locale" && state.alexa.key === code;
      return '<button type="button" class="card locale" data-locale="' + code + '" aria-pressed="' + on + '" aria-controls="alexa-panel">' +
        '<span class="flag flag--' + LOCALE_FLAGS[code] + '" aria-hidden="true"></span>' +
        '<span><span class="locale__code">' + code + '</span><br><span class="locale__name">' + esc(a.locales[code].name) + "</span></span></button>";
    }).join("");

    domWrap.innerHTML = Object.keys(a.domains).map(function (k) {
      var on = state.alexa.type === "domain" && state.alexa.key === k;
      var label = k === "others" ? t("alexa.others") : a.domains[k].name;
      return '<button type="button" class="chip' + (k === "others" ? " chip--muted" : "") + '" data-domain="' + k + '" aria-pressed="' + on + '" aria-controls="alexa-panel">' +
        '<i class="fa-solid ' + DOMAIN_ICONS[k] + '" aria-hidden="true"></i>' + esc(label) + "</button>";
    }).join("");

    renderAlexaPanel(false);
  }

  function renderAlexaPanel(animate) {
    var a = L().alexa, s = state.alexa, panel = $("#alexa-panel");
    var item, eyebrow;
    if (s.type === "locale") { item = a.locales[s.key]; eyebrow = s.key; }
    else { item = a.domains[s.key]; eyebrow = "es-ES · es-MX · es-US"; }
    var title = s.type === "locale" ? item.name : (s.key === "others" ? item.name : item.name);

    panel.innerHTML =
      '<p class="panel__eyebrow">' + esc(eyebrow) + "</p>" +
      '<h3 class="panel__title">' + esc(title) + "</h3>" +
      '<p class="panel__desc">' + fmt(item.desc) + "</p>" +
      '<p class="label mono" style="margin-top:24px;margin-bottom:0">' + esc(t("alexa.panelWork")) + "</p>" +
      '<div class="work">' + a.work.map(function (w) {
        return '<div class="work__item"><i class="fa-solid ' + w.icon + '" aria-hidden="true"></i><strong>' + esc(w.t) + "</strong><span>" + esc(w.d) + "</span></div>";
      }).join("") + "</div>";

    if (animate && !reduceMotion) {
      panel.classList.remove("panel-fade"); void panel.offsetWidth; panel.classList.add("panel-fade");
    }
  }

  function initAlexa() {
    $("#alexa").addEventListener("click", function (e) {
      var btn = e.target.closest("[data-locale], [data-domain]");
      if (!btn) return;
      state.alexa = btn.dataset.locale ? { type: "locale", key: btn.dataset.locale } : { type: "domain", key: btn.dataset.domain };
      $$("#alexa [data-locale], #alexa [data-domain]").forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
      renderAlexaPanel(true);
      if (window.innerWidth <= 860) $("#alexa-panel").focus({ preventScroll: false });
    });
  }

  /* ---------- Proyectos ---------- */
  var FILTERS = ["all", "ia", "datos", "auto", "ops", "lid", "personal"];

  function renderFilters() {
    $("#project-filters").innerHTML = FILTERS.map(function (f) {
      var label = f === "all" ? t("projects.all") : L().tags[f];
      return '<button type="button" class="filter" data-filter="' + f + '" aria-pressed="' + (state.filter === f) + '">' + esc(label) + "</button>";
    }).join("");
  }

  function renderProjects() {
    var tags = L().tags;
    $("#projects-grid").innerHTML = L().projects.map(function (p, i) {
      var metric = p.metric
        ? '<span class="project__metric">' + esc(p.metric.value) + "<small>" + esc(p.metric.label) + "</small></span>"
        : "";
      return '<button type="button" class="card project reveal" data-index="' + i + '" data-tags="' + p.tags.join(" ") + '" aria-haspopup="dialog">' +
        '<span class="project__top"><span class="project__icon"><i class="fa-solid ' + p.icon + '" aria-hidden="true"></i></span>' +
        '<span class="project__period">' + fmt(p.org) + "<br>" + fmt(p.period) + "</span></span>" +
        '<span class="project__title">' + esc(p.title) + "</span>" +
        '<span class="project__summary">' + esc(p.summary) + "</span>" +
        metric +
        '<span class="project__foot"><span class="tags">' + p.tags.map(function (tg) { return '<span class="tag">' + esc(tags[tg]) + "</span>"; }).join("") + "</span>" +
        '<span class="project__more">' + esc(t("projects.view")) + ' <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></span></span>' +
        "</button>";
    }).join("");
    applyFilter();
  }

  function applyFilter() {
    var visible = 0;
    $$("#projects-grid .project").forEach(function (card) {
      var show = state.filter === "all" || card.dataset.tags.split(" ").indexOf(state.filter) !== -1;
      card.classList.toggle("is-hidden", !show);
      if (show) { visible++; card.classList.add("is-visible"); }
    });
    $("#projects-empty").hidden = visible > 0;
  }

  function openProject(i, trigger) {
    var p = L().projects[i], tags = L().tags;
    var link = p.link
      ? '<a class="btn btn--ghost mp-link" href="' + p.link + '" target="_blank" rel="noopener"><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i> ' + esc(t("modal.visit")) + "</a>"
      : "";
    function step(n, key, body, extra) {
      return '<section class="mp-step' + (extra || "") + '"><span class="mp-step__n" aria-hidden="true">' + n + "</span><div><h3>" + esc(t(key)) + "</h3>" + body + "</div></section>";
    }
    $("#mp-content").innerHTML =
      '<div class="mp-head"><span class="project__icon"><i class="fa-solid ' + p.icon + '" aria-hidden="true"></i></span>' +
      '<div><p class="mp-meta">' + fmt(p.org) + " · " + fmt(p.period) + "</p></div></div>" +
      '<h2 id="mp-title">' + esc(p.title) + "</h2>" +
      '<div class="tags" style="margin-top:12px">' + p.tags.map(function (tg) { return '<span class="tag">' + esc(tags[tg]) + "</span>"; }).join("") + "</div>" +
      '<div class="mp-steps">' +
        step("01", "modal.context", "<p>" + fmt(p.context) + "</p>") +
        step("02", "modal.role", "<p>" + fmt(p.role) + "</p>") +
        step("03", "modal.did", "<ul>" + p.did.map(function (d) { return "<li>" + fmt(d) + "</li>"; }).join("") + "</ul>") +
        step("04", "modal.result", "<p>" + fmt(p.result) + "</p>", " mp-step--result") +
        step("05", "modal.tools", '<div class="skill-chips">' + p.tools.map(function (x) { return '<span class="skill-chip">' + fmt(x) + "</span>"; }).join("") + "</div>" + link) +
      "</div>";
    Modal.open("modal-project", trigger);
  }

  function initProjects() {
    $("#project-filters").addEventListener("click", function (e) {
      var b = e.target.closest("[data-filter]");
      if (!b) return;
      state.filter = b.dataset.filter;
      $$("#project-filters .filter").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      applyFilter();
    });
    $("#projects-grid").addEventListener("click", function (e) {
      var card = e.target.closest(".project");
      if (card) openProject(+card.dataset.index, card);
    });
  }

  /* ---------- Mapa SVG ---------- */
  var MAP_EDGES = [
    ["t:grammar", "p:alexa"], ["t:prompts", "p:alexa"], ["t:bedrock", "p:alexa"], ["t:docs", "p:alexa"],
    ["t:docs", "p:governance"], ["t:qa", "p:launches"], ["t:airtable", "p:airtable"], ["t:python", "p:diadiaia"],
    ["t:cloudflare", "p:diadiaia"], ["t:coaching", "p:support"],
    ["p:alexa", "r:accuracy"], ["p:alexa", "r:knowledge"], ["p:airtable", "r:hours"],
    ["p:governance", "r:criteria"], ["p:launches", "r:premieres"], ["p:diadiaia", "r:blog"], ["p:support", "r:sla"]
  ];
  var MAP_ORDER = {
    t: ["grammar", "prompts", "bedrock", "docs", "qa", "airtable", "python", "cloudflare", "coaching"],
    p: ["alexa", "governance", "airtable", "launches", "diadiaia", "support"],
    r: ["accuracy", "knowledge", "criteria", "hours", "premieres", "blog", "sla"]
  };
  var MAP_COLS = {
    t: { x: 20, w: 230, y0: 72, dy: 54, group: "tools", cls: "tool" },
    p: { x: 385, w: 230, y0: 98, dy: 76, group: "projects", cls: "project" },
    r: { x: 740, w: 240, y0: 84, dy: 67, group: "results", cls: "result" }
  };
  var NODE_H = 42;

  function nodeInfo(id) {
    var parts = id.split(":"), col = MAP_COLS[parts[0]];
    var data = L().map[col.group][parts[1]];
    var idx = MAP_ORDER[parts[0]].indexOf(parts[1]);
    return { id: id, kind: parts[0], col: col, label: data.label, desc: data.desc, cy: col.y0 + idx * col.dy };
  }
  function neighbors(id) {
    var out = [];
    MAP_EDGES.forEach(function (e) { if (e[0] === id) out.push(e[1]); else if (e[1] === id) out.push(e[0]); });
    return out;
  }
  // Para resaltar la cadena completa: herramienta → proyecto → resultado
  function chain(id) {
    var on = {}; on[id] = true;
    neighbors(id).forEach(function (n) {
      on[n] = true;
      if (id.charAt(0) !== "p" && n.charAt(0) === "p") neighbors(n).forEach(function (m) { if (m.charAt(0) !== id.charAt(0)) on[m] = true; });
    });
    return on;
  }

  function renderMap() {
    var nodesG = $("#map-nodes"), edgesG = $("#map-edges"), ns = "http://www.w3.org/2000/svg";
    nodesG.innerHTML = ""; edgesG.innerHTML = "";

    // Títulos de columna
    ["t", "p", "r"].forEach(function (k) {
      var c = MAP_COLS[k], txt = document.createElementNS(ns, "text");
      txt.setAttribute("x", c.x + c.w / 2); txt.setAttribute("y", 30); txt.setAttribute("text-anchor", "middle");
      txt.setAttribute("class", "m-col"); txt.setAttribute("aria-hidden", "true");
      txt.textContent = t("map." + c.group);
      nodesG.appendChild(txt);
    });

    MAP_EDGES.forEach(function (e) {
      var a = nodeInfo(e[0]), b = nodeInfo(e[1]);
      var x1 = a.col.x + a.col.w, x2 = b.col.x, mx = (x1 + x2) / 2;
      var path = document.createElementNS(ns, "path");
      path.setAttribute("d", "M" + x1 + " " + a.cy + " C" + mx + " " + a.cy + ", " + mx + " " + b.cy + ", " + x2 + " " + b.cy);
      path.setAttribute("class", "m-edge");
      path.dataset.a = e[0]; path.dataset.b = e[1];
      edgesG.appendChild(path);
    });

    ["t", "p", "r"].forEach(function (k) {
      MAP_ORDER[k].forEach(function (key) {
        var n = nodeInfo(k + ":" + key), g = document.createElementNS(ns, "g");
        g.setAttribute("class", "m-node m-node--" + n.col.cls);
        g.setAttribute("tabindex", "0");
        g.setAttribute("role", "button");
        g.setAttribute("aria-pressed", "false");
        g.setAttribute("aria-label", n.label + ". " + n.desc);
        g.dataset.id = n.id;
        g.innerHTML =
          '<rect x="' + n.col.x + '" y="' + (n.cy - NODE_H / 2) + '" width="' + n.col.w + '" height="' + NODE_H + '" rx="10"></rect>' +
          '<circle class="m-pip" cx="' + (n.col.x + 18) + '" cy="' + n.cy + '" r="5"></circle>' +
          '<text x="' + (n.col.x + 34) + '" y="' + (n.cy + 5) + '">' + esc(n.label) + "</text>";
        nodesG.appendChild(g);
      });
    });

    renderMapList();
    setMapActive(state.mapActive, false);
  }

  function setMapActive(id, focusPanel) {
    state.mapActive = id;
    var wrap = $(".map"), panel = $("#map-panel");
    wrap.classList.toggle("has-active", !!id);
    var on = id ? chain(id) : {};
    $$("#map-nodes .m-node").forEach(function (g) {
      var nid = g.dataset.id;
      g.classList.toggle("is-on", !!on[nid]);
      g.classList.toggle("is-active", nid === id);
      g.setAttribute("aria-pressed", String(nid === id));
    });
    $$("#map-edges .m-edge").forEach(function (p) { p.classList.toggle("is-on", !!(on[p.dataset.a] && on[p.dataset.b])); });

    if (!id) {
      panel.innerHTML = '<p class="map__hint"><i class="fa-solid fa-hand-pointer" aria-hidden="true"></i><span>' + esc(t("map.panelHint")) + "</span></p>";
      return;
    }
    var n = nodeInfo(id);
    var kindLabel = t("map." + n.col.group);
    panel.innerHTML =
      '<p class="panel__eyebrow">' + esc(kindLabel) + "</p>" +
      '<h3 class="panel__title">' + esc(n.label) + "</h3>" +
      '<p class="panel__desc">' + esc(n.desc) + "</p>" +
      '<p class="label mono" style="margin:8px 0 0">' + esc(t("map.connections")) + "</p>" +
      '<div class="tags">' + neighbors(id).map(function (m) {
        return '<button type="button" class="tag" data-map-go="' + m + '">' + esc(nodeInfo(m).label) + "</button>";
      }).join("") + "</div>" +
      '<button type="button" class="btn btn--ghost" data-map-reset><i class="fa-solid fa-rotate-left" aria-hidden="true"></i> ' + esc(t("map.reset")) + "</button>";
    if (focusPanel) panel.querySelector(".panel__title").setAttribute("tabindex", "-1");
  }

  function renderMapList() {
    var m = L().map;
    $("#map-list").innerHTML = MAP_ORDER.p.map(function (key) {
      var id = "p:" + key, nb = neighbors(id);
      function group(prefix, label) {
        var items = nb.filter(function (x) { return x.charAt(0) === prefix; });
        if (!items.length) return "";
        return '<div class="ml-group"><p class="label mono">' + esc(label) + '</p><div class="tags">' +
          items.map(function (x) { return '<span class="tag">' + esc(nodeInfo(x).label) + "</span>"; }).join("") + "</div></div>";
      }
      return '<details><summary><i class="dot dot--project" aria-hidden="true"></i>' + esc(m.projects[key].label) + "</summary>" +
        '<div class="ml-body"><p>' + esc(m.projects[key].desc) + "</p>" + group("t", t("map.tools")) + group("r", t("map.results")) + "</div></details>";
    }).join("");
  }

  function initMap() {
    var nodesG = $("#map-nodes");
    nodesG.addEventListener("click", function (e) {
      var g = e.target.closest(".m-node");
      if (g) setMapActive(state.mapActive === g.dataset.id ? null : g.dataset.id, true);
    });
    nodesG.addEventListener("keydown", function (e) {
      var g = e.target.closest(".m-node");
      if (!g) return;
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setMapActive(state.mapActive === g.dataset.id ? null : g.dataset.id, true); }
      if (e.key === "Escape") setMapActive(null);
    });
    $("#map-panel").addEventListener("click", function (e) {
      var go = e.target.closest("[data-map-go]");
      if (go) {
        setMapActive(go.dataset.mapGo, true);
        var target = $('#map-nodes .m-node[data-id="' + go.dataset.mapGo + '"]');
        if (target) target.focus();
      }
      if (e.target.closest("[data-map-reset]")) setMapActive(null);
    });
  }

  /* ---------- Trayectoria y habilidades ---------- */
  function renderTimeline() {
    $("#timeline").innerHTML = L().timeline.map(function (it) {
      return '<li class="tl-item reveal"><p class="tl-period">' + esc(it.period) + " · " + esc(it.place) + "</p>" +
        '<h3 class="tl-role">' + esc(it.role) + '</h3><p class="tl-org">' + esc(it.org) + "</p>" +
        '<p class="tl-desc">' + fmt(it.desc) + "</p></li>";
    }).join("");
    $("#education").innerHTML = L().education.map(function (ed, i) {
      return '<article class="card edu__item reveal"><i class="fa-solid ' + (i === 0 ? "fa-graduation-cap" : "fa-chalkboard-user") + '" aria-hidden="true"></i>' +
        "<h3>" + esc(ed.title) + '</h3><p class="edu__org">' + esc(ed.org) + "</p><p>" + esc(ed.desc) + "</p></article>";
    }).join("");
  }

  function renderSkills() {
    $("#skills").innerHTML = L().skills.map(function (g) {
      return '<article class="card skill-group reveal"><h3><i class="fa-solid ' + g.icon + '" aria-hidden="true"></i>' + esc(g.title) + "</h3>" +
        '<ul class="skill-chips">' + g.items.map(function (x) { return '<li class="skill-chip">' + esc(x) + "</li>"; }).join("") + "</ul></article>";
    }).join("");
    var filled = $(".langs.is-visible") || reduceMotion;
    $("#languages").innerHTML = L().languages.map(function (l) {
      return '<li class="lang-row"><div class="lang-row__head"><span class="lang-row__name">' + esc(l.name) + '</span><span class="lang-row__level">' + esc(l.level) + "</span></div>" +
        '<div class="bar" role="img" aria-label="' + esc(l.name + ": " + l.level) + '"><div class="bar__fill" data-pct="' + l.pct + '"' + (filled ? ' style="width:' + l.pct + '%"' : "") + "></div></div></li>";
    }).join("");
  }

  /* ---------- Modales ---------- */
  var Modal = (function () {
    var stack = [];
    var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not(.honeypot), textarea, select, [tabindex]:not([tabindex="-1"])';
    function open(id, trigger) {
      var m = document.getElementById(id);
      if (!m || !m.hidden) return;
      m.hidden = false;
      stack.push({ el: m, trigger: trigger || document.activeElement });
      document.body.classList.add("modal-open");
      var f = $$(FOCUSABLE, m).filter(function (x) { return !x.closest("[hidden]"); });
      var target = f[1] || f[0];   // f[0] es el botón cerrar: mejor ir al contenido
      if (id === "modal-contact") target = $("#f-name");
      if (target) target.focus();
    }
    function close() {
      var top = stack.pop();
      if (!top) return;
      top.el.hidden = true;
      if (!stack.length) document.body.classList.remove("modal-open");
      if (top.trigger && top.trigger.focus) top.trigger.focus();
    }
    document.addEventListener("keydown", function (e) {
      if (!stack.length) return;
      var m = stack[stack.length - 1].el;
      if (e.key === "Escape") { e.preventDefault(); close(); return; }
      if (e.key !== "Tab") return;
      var f = $$(FOCUSABLE, m);
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    document.addEventListener("click", function (e) {
      var opener = e.target.closest("[data-open-modal]");
      if (opener) { e.preventDefault(); open(opener.dataset.openModal, opener); return; }
      if (e.target.closest("[data-close-modal]") && stack.length) {
        var m = stack[stack.length - 1].el;
        if (m.contains(e.target)) close();
      }
    });
    return { open: open, close: close };
  })();

  /* ---------- Formulario de contacto ---------- */
  function initForm() {
    var form = $("#contact-form"), status = $("#f-status"), submit = $("#f-submit");
    var fields = {
      name: { el: $("#f-name"), err: "form.errName", ok: function (v) { return v.trim().length >= 2; } },
      email: { el: $("#f-email"), err: "form.errEmail", ok: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); } },
      message: { el: $("#f-message"), err: "form.errMessage", ok: function (v) { return v.trim().length >= 10; } },
      privacy: { el: $("#f-privacy"), err: "form.errPrivacy", ok: function () { return $("#f-privacy").checked; } }
    };
    function check(key) {
      var f = fields[key], valid = f.ok(f.el.value), box = f.el.closest(".field"), errEl = $("#" + f.el.id + "-err");
      box.classList.toggle("has-error", !valid);
      f.el.setAttribute("aria-invalid", String(!valid));
      errEl.textContent = valid ? "" : t(f.err);
      return valid;
    }
    Object.keys(fields).forEach(function (k) {
      var ev = k === "privacy" ? "change" : "input";
      fields[k].el.addEventListener(ev, function () { if (fields[k].el.closest(".field").classList.contains("has-error")) check(k); });
      if (k !== "privacy") fields[k].el.addEventListener("blur", function () { if (fields[k].el.value) check(k); });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      status.textContent = ""; status.className = "form__status";
      var firstBad = null;
      Object.keys(fields).forEach(function (k) { if (!check(k) && !firstBad) firstBad = fields[k].el; });
      if (firstBad) { firstBad.focus(); return; }

      if (FORMSPREE_ENDPOINT.indexOf("TU_ID") !== -1) {
        status.textContent = t("form.notConfigured"); status.classList.add("is-error"); return;
      }

      var label = submit.querySelector("span"), original = label.textContent;
      submit.disabled = true; label.textContent = t("form.sending");
      var data = new FormData(form);
      data.delete("privacy");
      data.append("_language", state.lang);
      fetch(FORMSPREE_ENDPOINT, { method: "POST", body: data, headers: { Accept: "application/json" } })
        .then(function (r) {
          if (!r.ok) throw new Error("HTTP " + r.status);
          form.reset();
          status.textContent = t("form.ok"); status.classList.add("is-ok");
        })
        .catch(function () { status.textContent = t("form.fail"); status.classList.add("is-error"); })
        .then(function () { submit.disabled = false; label.textContent = original; });
    });
  }

  /* ---------- Foto ---------- */
  function initPhoto() {
    var img = $("#hero-photo"), frame = img.closest(".photo-frame");
    function fail() { frame.classList.add("no-photo"); }
    img.addEventListener("error", fail);
    if (img.complete && img.naturalWidth === 0) fail();
  }

  /* ---------- Inicio ---------- */
  function init() {
    var saved = store("jm-lang");
    var nav = (navigator.language || "es").toLowerCase();
    state.lang = saved && I18N[saved] ? saved : (nav.indexOf("es") === 0 ? "es" : "en");

    $$(".lang__btn").forEach(function (b) { b.addEventListener("click", function () { setLang(b.dataset.lang); }); });
    $("#theme-toggle").addEventListener("click", function () {
      setTheme(document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light");
    });
    $("#year").textContent = new Date().getFullYear();

    initPhoto();
    initNav();
    initAlexa();
    initProjects();
    initMap();
    initForm();
    setLang(state.lang);
    initCounters();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
