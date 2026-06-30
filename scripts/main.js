/* ============================================================================
   main.js — progressive-enhancement chrome for the PHOS dashboard.
   The page is fully readable with JS off; this layer adds the theme picker,
   sticky-nav state, reveal-on-scroll, count-ups, Pretext exact-fit display
   type, eased in-page scrolling, and the ⌘K command palette.
   Mirrors the samjo.me portfolio so the two sites feel like one hand.
   ========================================================================== */
import { readyFonts, fitFontSize } from "../assets/vendor/lib.js";

const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const debounce = (fn, ms = 160) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const escapeHTML = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* ---------- Theme ---------- */
const THEMES = [
  { id: "light", name: "Paper", note: "Ink on warm paper" },
  { id: "forest", name: "Forest", note: "Bottle-green & tan" },
  { id: "dark", name: "Ember", note: "Warm dark & brass" },
  { id: "midnight", name: "Midnight", note: "Deep navy & blue" },
  { id: "bordeaux", name: "Bordeaux", note: "Wine-black & brass" },
];
function systemTheme() { return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"; }
function currentTheme() { return document.documentElement.getAttribute("data-theme") || systemTheme(); }
function applyTheme(id) {
  document.documentElement.setAttribute("data-theme", id);
  try { localStorage.setItem("theme", id); } catch (e) {}
  document.dispatchEvent(new CustomEvent("themechanged", { detail: id }));
}
function initTheme() {
  const btn = $(".theme-toggle");
  if (!btn) return;
  btn.setAttribute("aria-haspopup", "true");
  btn.setAttribute("aria-expanded", "false");

  const menu = document.createElement("div");
  menu.className = "theme-menu";
  btn.parentNode.insertBefore(menu, btn);
  menu.appendChild(btn);

  const pop = document.createElement("div");
  pop.className = "theme-pop"; pop.setAttribute("role", "menu"); pop.setAttribute("aria-label", "Theme"); pop.hidden = true;
  const opts = THEMES.map((t) => {
    const o = document.createElement("button");
    o.type = "button"; o.className = "theme-opt"; o.setAttribute("role", "menuitemradio"); o.dataset.theme = t.id;
    o.innerHTML = `<span class="sw sw-${t.id}" aria-hidden="true"></span><span>${t.name}</span><span class="check" aria-hidden="true">✓</span>`;
    o.addEventListener("click", () => { applyTheme(t.id); sync(); close(); btn.focus(); });
    pop.appendChild(o); return o;
  });
  menu.appendChild(pop);

  function sync() { const c = currentTheme(); opts.forEach((o) => o.setAttribute("aria-checked", String(o.dataset.theme === c))); }
  function onDoc(e) { if (!menu.contains(e.target)) close(); }
  function onKey(e) { if (e.key === "Escape") { close(); btn.focus(); } }
  function open() { pop.hidden = false; btn.setAttribute("aria-expanded", "true"); sync(); addEventListener("keydown", onKey); setTimeout(() => addEventListener("click", onDoc), 0); }
  function close() { pop.hidden = true; btn.setAttribute("aria-expanded", "false"); removeEventListener("keydown", onKey); removeEventListener("click", onDoc); }
  btn.addEventListener("click", (e) => { e.stopPropagation(); pop.hidden ? open() : close(); });
  document.addEventListener("themechanged", sync);
  sync();
}

/* ---------- Sticky nav: scrolled state + active links + scroll progress ---------- */
function initNav() {
  const nav = $(".site-nav"); const bar = $("[data-progress]");
  if (nav || bar) {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (nav) nav.classList.toggle("is-scrolled", window.scrollY > 8);
        if (bar) { const h = document.documentElement.scrollHeight - window.innerHeight; bar.style.transform = "scaleX(" + (h > 0 ? clamp(window.scrollY / h, 0, 1) : 0) + ")"; }
      });
    };
    onScroll(); addEventListener("scroll", onScroll, { passive: true }); addEventListener("resize", onScroll, { passive: true });
  }
  const links = $$(".nav-links a[href^='#'], .index-rail a[href^='#']");
  const bySection = new Map();
  links.forEach((a) => { const id = a.getAttribute("href").slice(1); const sec = id && document.getElementById(id); if (!sec) return; if (!bySection.has(sec)) bySection.set(sec, []); bySection.get(sec).push(a); });
  if (!bySection.size || !("IntersectionObserver" in window)) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (!e.isIntersecting) return; links.forEach((l) => l.removeAttribute("aria-current")); (bySection.get(e.target) || []).forEach((a) => a.setAttribute("aria-current", "page")); });
  }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
  bySection.forEach((_, sec) => obs.observe(sec));
}

/* ---------- Reveal on scroll ---------- */
function initReveals() {
  const items = $$(".reveal");
  if (prefersReduced || !("IntersectionObserver" in window)) { items.forEach((el) => el.classList.add("is-in")); return; }
  const obs = new IntersectionObserver((entries, o) => { entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); o.unobserve(e.target); } }); }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });
  items.forEach((el) => obs.observe(el));
}

/* ---------- Pretext: exact-fit display type ---------- */
function fitOne(el) {
  const text = (el.dataset.fitText || el.textContent || "").trim();
  if (!text) return;
  const cs = getComputedStyle(el);
  const family = cs.fontFamily.split(",")[0].replace(/["']/g, "").trim();
  const weight = parseInt(cs.fontWeight, 10) || 360;
  const target = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  if (target <= 0) return;
  let max = parseFloat(el.dataset.fitMax) || 280;
  const vh = parseFloat(el.dataset.fitVh);
  if (vh) max = Math.min(max, innerHeight * vh);
  const min = parseFloat(el.dataset.fitMin) || 22;
  const size = fitFontSize(text, { family: `'${family}'`, weight, target, min, max });
  el.style.fontSize = size.toFixed(2) + "px";
  el.classList.add("is-fitted");
}
async function initFit() {
  const els = $$("[data-fit]");
  if (!els.length) return;
  try { await readyFonts(); } catch (e) {}
  const run = () => els.forEach(fitOne);
  run();
  let raf; addEventListener("resize", () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(run); }, { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(run);
}

/* ---------- Year + inline count-ups ---------- */
function initYear() { $$("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); }); }
function initCounters() {
  const els = $$(".count[data-count-to]");
  if (!els.length) return;
  const fmt = (v, dec) => v.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
  const final = (el) => { const dec = +(el.dataset.countDecimals || 0); el.textContent = (el.dataset.countPrefix || "") + fmt(+el.dataset.countTo, dec) + (el.dataset.countSuffix || ""); };
  if (prefersReduced || !("IntersectionObserver" in window)) { els.forEach(final); return; }
  const animate = (el) => {
    const to = +el.dataset.countTo, dec = +(el.dataset.countDecimals || 0), suffix = el.dataset.countSuffix || "", prefix = el.dataset.countPrefix || "", dur = 1100;
    let start;
    const step = (ts) => { if (start == null) start = ts; const p = Math.min(1, (ts - start) / dur), e = 1 - Math.pow(1 - p, 3), val = to * e; el.textContent = prefix + fmt(dec ? val : Math.round(val), dec) + suffix; if (p < 1) requestAnimationFrame(step); else final(el); };
    requestAnimationFrame(step);
  };
  const obs = new IntersectionObserver((ents, o) => { ents.forEach((e) => { if (e.isIntersecting) { animate(e.target); o.unobserve(e.target); } }); }, { threshold: 0.6 });
  els.forEach((el) => { const dec = +(el.dataset.countDecimals || 0); el.textContent = (el.dataset.countPrefix || "") + fmt(0, dec) + (el.dataset.countSuffix || ""); obs.observe(el); });
}

/* ---------- Command palette (⌘K) — jump to sections + open resources + theme ---------- */
const IC = {
  jump: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  ext: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M9 7h8v8"/></svg>',
  doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/></svg>',
};
function initCommandPalette(extLinks) {
  const openers = $$("[data-cmdk-open]");
  if (!openers.length) return;

  const jumps = [];
  const seen = new Set();
  $$(".index-rail a[href^='#'], .nav-links a[href^='#']").forEach((a) => {
    const id = a.getAttribute("href").slice(1); if (!id || seen.has(id) || !document.getElementById(id)) return; seen.add(id);
    const label = a.textContent.replace(/^\s*\d+\s*/, "").trim();
    jumps.push({ group: "Jump to", icon: IC.jump, title: label, sub: "#" + id, kw: id + " " + label, run: () => goTo(id) });
  });
  const ext = (extLinks || []).map((l) => ({ group: l.group || "Open", icon: l.icon === "doc" ? IC.doc : IC.ext, title: l.title, sub: l.sub || l.url, kw: (l.title + " " + (l.sub || "")).toLowerCase(), run: () => openExt(l.url) }));
  const themes = THEMES.map((t) => ({ group: "Theme", iconHTML: `<span class="sw sw-${t.id}"></span>`, title: t.name, sub: t.note, kw: "theme " + t.name, keepOpen: true, run: () => { applyTheme(t.id); render(input.value); } }));
  const COMMANDS = [...jumps, ...ext, ...themes];

  const overlay = document.createElement("div");
  overlay.className = "cmdk"; overlay.hidden = true; overlay.setAttribute("role", "dialog"); overlay.setAttribute("aria-modal", "true"); overlay.setAttribute("aria-label", "Command menu");
  overlay.innerHTML =
    '<div class="cmdk__panel">' +
      '<div class="cmdk__field">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>' +
        '<input class="cmdk__input" type="text" role="combobox" aria-expanded="true" aria-autocomplete="list" aria-controls="cmdk-list" placeholder="Search or jump anywhere…" />' +
        '<span class="cmdk__esc">esc</span>' +
      '</div>' +
      '<div class="cmdk__list" id="cmdk-list" role="listbox" aria-label="Commands"></div>' +
      '<div class="cmdk__foot"><span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span><span><kbd>↵</kbd> Open</span><span><kbd>esc</kbd> Close</span></div>' +
    '</div>';
  document.body.appendChild(overlay);
  const input = $(".cmdk__input", overlay), list = $("#cmdk-list", overlay);
  let filtered = [], active = 0, lastFocus = null;

  const match = (q, c) => { if (!q) return true; q = q.toLowerCase(); const hay = (c.title + " " + c.sub + " " + c.kw).toLowerCase(); if (hay.includes(q)) return true; let i = 0; for (const ch of q) { i = hay.indexOf(ch, i); if (i < 0) return false; i++; } return true; };
  function render(q) {
    filtered = COMMANDS.filter((c) => match(q, c)); list.innerHTML = "";
    if (!filtered.length) { list.innerHTML = '<p class="cmdk__empty">No matches.</p>'; input.removeAttribute("aria-activedescendant"); return; }
    let lastGroup = null, idx = 0;
    filtered.forEach((c) => {
      if (c.group !== lastGroup) { const g = document.createElement("p"); g.className = "cmdk__group"; g.textContent = c.group; list.appendChild(g); lastGroup = c.group; }
      const item = document.createElement("button");
      item.type = "button"; item.className = "cmdk__item"; item.id = "cmdk-opt-" + idx; item.setAttribute("role", "option"); item.tabIndex = -1; item.dataset.i = idx;
      item.innerHTML = `<span class="cmdk__item-ic">${c.iconHTML || c.icon}</span><span class="cmdk__item-tx"><b>${escapeHTML(c.title)}</b><span>${escapeHTML(c.sub)}</span></span><span class="cmdk__item-go">↵</span>`;
      item.addEventListener("click", () => exec(+item.dataset.i));
      item.addEventListener("pointermove", () => setActive(+item.dataset.i));
      list.appendChild(item); idx++;
    });
    active = 0; paint();
  }
  function paint() { $$(".cmdk__item", list).forEach((el) => { const on = +el.dataset.i === active; el.setAttribute("aria-selected", String(on)); if (on) { input.setAttribute("aria-activedescendant", el.id); el.scrollIntoView({ block: "nearest" }); } }); }
  function setActive(i) { active = clamp(i, 0, filtered.length - 1); paint(); }
  function exec(i) { const c = filtered[i]; if (!c) return; const keep = c.keepOpen; c.run(); if (!keep) close(); }
  function open() { if (!overlay.hidden) return; lastFocus = document.activeElement; overlay.hidden = false; document.documentElement.style.overflow = "hidden"; input.value = ""; render(""); input.focus(); }
  function close() { if (overlay.hidden) return; overlay.hidden = true; document.documentElement.style.overflow = ""; if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  const toggle = () => (overlay.hidden ? open() : close());

  input.addEventListener("input", () => render(input.value));
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(active + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive(active - 1); }
    else if (e.key === "Home") { e.preventDefault(); setActive(0); }
    else if (e.key === "End") { e.preventDefault(); setActive(filtered.length - 1); }
    else if (e.key === "Enter") { e.preventDefault(); exec(active); }
    else if (e.key === "Escape") { e.preventDefault(); close(); }
  });
  overlay.addEventListener("pointerdown", (e) => { if (e.target === overlay) close(); });
  openers.forEach((b) => b.addEventListener("click", (e) => { e.preventDefault(); open(); }));
  const isTyping = (el) => el && (/^(input|textarea|select)$/i.test(el.tagName) || el.isContentEditable);
  addEventListener("keydown", (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); toggle(); } else if (e.key === "/" && overlay.hidden && !isTyping(e.target)) { e.preventDefault(); open(); } });

  function goTo(id) { const el = document.getElementById(id); close(); if (el) { el.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" }); history.replaceState(null, "", "#" + id); } }
  function openExt(url) { close(); window.open(url, url.startsWith("mailto:") ? "_self" : "_blank", "noopener"); }
}

/* ---------- Eased in-page scrolling (anchor clicks only) ---------- */
function initSmoothScroll() {
  const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 60;
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  let raf = 0, stop = null;
  function focusTarget(el) { if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1"); el.focus({ preventScroll: true }); }
  function glide(targetY, el) {
    const maxY = document.documentElement.scrollHeight - innerHeight; targetY = Math.max(0, Math.min(targetY, maxY));
    const startY = window.scrollY, dist = targetY - startY;
    if (prefersReduced || Math.abs(dist) < 2) { window.scrollTo(0, targetY); if (el) focusTarget(el); return; }
    const dur = clamp(Math.abs(dist) * 0.5, 380, 720); let t0 = null, killed = false;
    cancelAnimationFrame(raf); if (stop) stop();
    const cancel = () => { killed = true; cancelAnimationFrame(raf); if (stop) { stop(); stop = null; } };
    const onKey = (e) => { if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(e.key)) cancel(); };
    addEventListener("wheel", cancel, { passive: true }); addEventListener("touchstart", cancel, { passive: true }); addEventListener("keydown", onKey);
    stop = () => { removeEventListener("wheel", cancel); removeEventListener("touchstart", cancel); removeEventListener("keydown", onKey); };
    const step = (now) => { if (killed) return; if (t0 == null) t0 = now; const p = Math.min(1, (now - t0) / dur); window.scrollTo(0, startY + dist * ease(p)); if (p < 1) raf = requestAnimationFrame(step); else { if (stop) { stop(); stop = null; } if (el) focusTarget(el); } };
    raf = requestAnimationFrame(step);
  }
  document.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;
    const a = e.target.closest('a[href^="#"]'); if (!a || a.classList.contains("skip-link")) return;
    const id = a.getAttribute("href").slice(1); const el = id && document.getElementById(id); if (!el) return;
    e.preventDefault(); glide(el.getBoundingClientRect().top + window.scrollY - navH - 12, el); history.replaceState(null, "", "#" + id);
  });
}

/* ---------- Section-index rail: fade the edge that still has items ---------- */
function initRailFade() {
  const rail = $(".index-rail"); if (!rail) return;
  const update = () => { const max = rail.scrollWidth - rail.clientWidth; rail.style.setProperty("--ml", rail.scrollLeft > 2 ? "24px" : "0px"); rail.style.setProperty("--mr", rail.scrollLeft < max - 2 ? "24px" : "0px"); };
  update(); rail.addEventListener("scroll", update, { passive: true }); addEventListener("resize", debounce(update, 150));
}

/* public: run all chrome. `opts.cmdkLinks` adds external commands to ⌘K. */
export function initChrome(opts = {}) {
  initTheme();
  initNav();
  initSmoothScroll();
  initRailFade();
  initReveals();
  initYear();
  initCounters();
  initFit();
  initCommandPalette(opts.cmdkLinks);
}

export { escapeHTML, prefersReduced };
