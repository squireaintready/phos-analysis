/* ============================================================================
   dashboard.js — orchestrates the PHOS equity-research report.
   Imports the committed data + the SVG chart toolkit + the shared chrome,
   renders every section, and wires the interactive valuation model and the
   live share-price feed (/api/quote, with graceful fallback). All fundamentals
   trace to data.js (generated from data.xlsx); only the headline quote is live.
   ========================================================================== */
import { DATA } from "./data.js";
import * as C from "./charts.js";
import { initChrome, escapeHTML } from "./main.js";

/* ---------------- formatters & helpers ---------------- */
const cad = (v) => (v < 0 ? "−" : "") + "C$" + C.short(Math.abs(v));
const pct = (v, d = 0) => (v * 100).toFixed(d) + "%";
const mult = (v) => v.toFixed(2) + "×";
const price = (v) => "C$" + v.toFixed(2);
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const stars = (n) => `<span class="stars" aria-label="${n} of 5"><span class="stars__on" style="width:${(n / 5) * 100}%">★★★★★</span><span class="stars__off">★★★★★</span></span>`;

/* shared price state — fundamentals are fixed; the headline price can go live */
const state = { price: DATA.valuation.currentPrice, live: false };

/* ---------------- chrome ---------------- */
initChrome({
  cmdkLinks: [
    { group: "Open", title: "First Phosphate — investor site", sub: "firstphosphate.com", url: "https://firstphosphate.com/" },
    { group: "Open", title: "SEDAR+ filings", sub: "sedarplus.ca", url: "https://www.sedarplus.ca/" },
    { group: "Open", title: "Download the model (.xlsx)", sub: "phos-financial-model.xlsx", icon: "doc", url: "/data/phos-financial-model.xlsx" },
    { group: "Open", title: "Source on GitHub", sub: "squireaintready/phos-analysis", url: "https://github.com/squireaintready/phos-analysis" },
    { group: "Open", title: "Samuel Jo — portfolio", sub: "samjo.me", url: "https://samjo.me/" },
  ],
});

/* ---------------- table helper ---------------- */
function tableHTML(headers, rows, opts = {}) {
  const head = "<thead><tr>" + headers.map((h, i) => `<th${i === 0 ? ' scope="col"' : ' scope="col" class="num"'}>${h}</th>`).join("") + "</tr></thead>";
  const body = "<tbody>" + rows.map((r) => "<tr" + (r._self ? ' class="is-self"' : "") + ">" + r.cells.map((c, i) => i === 0 ? `<th scope="row">${c}</th>` : `<td class="num">${c}</td>`).join("") + "</tr>").join("") + "</tbody>";
  return `<table class="dtable${opts.cls ? " " + opts.cls : ""}">${head}${body}</table>`;
}
const kvHTML = (rows) => rows.map((r) => `<div class="kv"><dt>${escapeHTML(r.k)}</dt><dd>${escapeHTML(r.v)}</dd></div>`).join("");

/* ===================================================== coverage / masthead */
function renderCoverage() {
  const c = DATA.coverage;
  $("#cov-assess").textContent = c.assessment.split(" — ")[0];
  $("#cov-stats").innerHTML = c.stats.map((s) => `<div data-k="${escapeHTML(s.k)}"><dt>${escapeHTML(s.k)}</dt><dd>${escapeHTML(s.v)}</dd></div>`).join("");
  // fair-value bar: range lo..hi within a 0..max domain, with a "now" marker
  const lo = c.fairValueLow, hi = c.fairValueHigh;
  const fvbar = $("#cov-fvbar");
  const set = () => {
    const now = state.price;
    // once live, re-derive the price-dependent coverage stats so the box is self-consistent
    if (state.live) {
      const mc = now * DATA.capital.sharesBasic;
      const mcDd = $('#cov-stats [data-k="Mkt cap"] dd'); if (mcDd) mcDd.textContent = cad(mc);
      const navDd = $('#cov-stats [data-k="Mkt cap / NAV"] dd'); if (navDd) navDd.textContent = pct(mc / DATA.valuation.npv, 0);
    }
    const max = Math.max(hi, now) * 1.08;   // keep the live "now" marker on-scale even above the band
    const px = (v) => Math.max(0, Math.min(100, (v / max) * 100));
    fvbar.innerHTML = `
      <span class="fvbar__range" style="left:${px(lo)}%;right:${100 - px(hi)}%"></span>
      <span class="fvbar__now" style="left:${px(now)}%" title="Now ${price(now)}"></span>
      <span class="fvbar__now-lab" style="left:${px(now)}%">${state.live ? "live " : ""}${price(now)}</span>
      <span class="fvbar__lab" style="left:${px(lo)}%">${price(lo)}</span>
      <span class="fvbar__lab" style="left:${px(hi)}%">${price(hi)}</span>`;
  };
  set();
  fvbar._set = set;
}

/* ===================================================== thesis */
function renderThesis() {
  ["bull", "base", "bear"].forEach((k) => {
    const ul = $(`[data-thesis="${k}"]`);
    if (ul) ul.innerHTML = DATA.thesis[k].map((t) => `<li>${escapeHTML(t)}</li>`).join("");
  });
}

/* ===================================================== project */
function renderProject() {
  const pd = DATA.projectDetail;
  $("#proj-summary").textContent = pd.summary;
  $("#proj-economics").innerHTML = kvHTML(pd.economics);
  C.donut($("#proj-resource"), {
    slices: pd.resource.split.map((s) => ({ label: s.label, value: s.pct * 100 })),
    centerLabel: pd.resource.total + " Mt", centerSub: pd.resource.grade,
    label: "Resource classification: 83% Inferred, 17% Measured + Indicated.",
  });
  $("#proj-downstream").innerHTML = pd.downstream.map((s, i) => `
    <li class="chain__step">
      <span class="chain__n">${i + 1}</span>
      <div class="chain__body">
        <p class="chain__step-h">${escapeHTML(s.step)} <span class="chain__status chain__status--${s.status.toLowerCase().replace(/[^a-z]/g, "")}">${escapeHTML(s.status)}</span></p>
        <p class="chain__detail">${escapeHTML(s.detail)}</p>
      </div>
      <span class="chain__capex">${escapeHTML(s.capex)}</span>
    </li>`).join("");
}

/* ===================================================== market */
function renderMarket() {
  const m = DATA.market;
  C.lineArea($("#market-growth"), {
    x: m.marketGrowth.years,
    series: [
      { name: "High", values: m.marketGrowth.high },
      { name: "Low", values: m.marketGrowth.low, color: "--text-mute" },
    ],
    yFormat: (v) => "$" + v + "B", tipFormat: (v) => "US$" + v + "B",
    label: `LFP battery market projected to grow at ${m.marketGrowth.cagr} CAGR.`,
  });
  $("#market-drivers").innerHTML = m.drivers.map((d) => `
    <div class="driver">
      <p class="driver__k">${escapeHTML(d.k)}</p>
      <p class="driver__v">${escapeHTML(d.v)}</p>
      <p class="driver__n">${escapeHTML(d.note)}</p>
    </div>`).join("");
}

/* ===================================================== supply chain */
function renderSupply() {
  const sc = DATA.supplyChain;
  $("#supply-chain").innerHTML = `
    <ol class="sc-flow">${sc.chain.map((node, i) => `
      <li class="sc-node ${i <= sc.phosNode ? "is-phos" : ""}">${escapeHTML(node)}</li>
      ${i < sc.chain.length - 1 ? '<li class="sc-arrow" aria-hidden="true">→</li>' : ""}`).join("")}
    </ol>
    <p class="sc-caption">PHOS spans <strong>rock → purified phosphoric acid</strong>, with the cathode steps planned. The Québec cluster supplies three of four LFP inputs:</p>
    <div class="sc-cluster">${sc.cluster.map((c) => `<span class="sc-chip ${c.self ? "is-self" : ""}"><b>${escapeHTML(c.ticker)}</b> ${escapeHTML(c.input)}</span>`).join("")}</div>`;
  $("#supply-insight").textContent = sc.insight;
}

/* ===================================================== financials charts */
function renderCharts() {
  const f = DATA.financials, b = DATA.burn;
  C.lineArea($("#chart-balance"), { x: f.periods, series: [
      { name: "Total assets", values: f.totalAssets },
      { name: "Cash", values: f.cash, color: "--up" },
      { name: "Equity", values: f.equity, color: "--text-mute" },
    ], yFormat: C.short, tipFormat: cad, label: "Balance-sheet growth across five periods." });
  C.bars($("#chart-netloss"), { x: b.quarters, values: b.netLoss, signed: true, yFormat: C.short, tipFormat: cad, label: "Quarterly net loss across eight quarters." });
  C.donut($("#chart-expenses"), { slices: f.expenseBreakdownFY2025, centerLabel: cad(f.expenseBreakdownFY2025.reduce((a, s) => a + s.value, 0)), centerSub: "FY2025 opex", label: "FY2025 operating expenses by category." });
  C.lineArea($("#chart-cash"), { x: b.quarters, series: [{ name: "Cash", values: b.cashBalance }], yFormat: C.short, tipFormat: cad, label: "Cash balance across eight quarters." });
  C.bars($("#chart-dilution"), { x: b.quarters, values: b.sharesOutstanding, yFormat: C.short, tipFormat: (v) => (v / 1e6).toFixed(1) + "M shares", label: "Shares outstanding more than double across eight quarters." });
  C.hbars($("#chart-peers-nav"), { rows: DATA.peers.navDiscount.map((p) => ({ label: p.ticker, value: p.mktNpv, self: p.self })), valueFormat: mult, label: "Market cap as a multiple of study NAV." });
  C.hbars($("#chart-peers-irr"), { rows: DATA.peers.irr.map((p) => ({ label: p.ticker, value: p.irr, self: p.self })), valueFormat: (v) => pct(v, 0), label: "After-tax IRR by project." });
}

function renderRatios() {
  const f = DATA.financials;
  const rows = [
    { cells: ["Book value / share", ...f.bookValuePerShare.map((v) => price(v))] },
    { cells: ["Current ratio", ...f.currentRatio.map((v) => v.toFixed(1) + "×")] },
    { cells: ["Debt / equity", ...f.debtToEquity.map((v) => v.toFixed(2))] },
    { cells: ["Cash / assets", ...f.cashPctAssets.map((v) => pct(v))] },
  ];
  $("#table-ratios").innerHTML = tableHTML(["Metric", ...f.periods], rows);
}

function renderRunway() {
  const r = DATA.runway, maxMo = Math.max(...r.scenarios.map((s) => s.months));
  $("#runway-scenarios").innerHTML = r.scenarios.map((s) => `
    <div class="scenario">
      <div class="scenario__top"><span class="scenario__name">${s.name}</span><span class="scenario__mo">${s.months.toFixed(0)} mo</span></div>
      <div class="scenario__track"><span class="scenario__bar" style="width:${(s.months / maxMo) * 100}%"></span></div>
      <p class="scenario__note">${cad(s.qBurn)}/qtr · ${escapeHTML(s.note)}</p>
    </div>`).join("") + `<p class="scenario__foot">Based on ~${cad(r.estCashJan2026)} estimated cash (Jan 2026).</p>`;
}

function renderCapex() {
  const g = DATA.capexGap;
  const items = g.items.map((it) => `<li class="wf__item"><span class="wf__bar" style="width:${(it.value / g.totalRequired) * 100}%"></span><span class="wf__lab">${escapeHTML(it.label)}</span><span class="wf__val">${cad(it.value)}</span></li>`).join("");
  $("#capex-gap").innerHTML = `<ul class="wf__list">${items}</ul>
    <div class="wf__sum">
      <div class="wf__row"><span>Total capital required</span><b>${cad(g.totalRequired)}</b></div>
      <div class="wf__row wf__row--ok"><span>Available (cash less 2-yr burn)</span><b>${cad(g.availableForCapex)}</b></div>
      <div class="wf__row wf__row--gap"><span>Funding gap</span><b>−${cad(g.fundingGap)}</b></div>
    </div>
    <p class="wf__note">Needs project finance, debt, JV and/or further equity to close.</p>`;
}

/* ===================================================== capital structure */
function renderCapital() {
  const cap = DATA.capital;
  C.donut($("#cap-ownership"), {
    slices: cap.ownership.map((o) => ({ label: o.name, value: o.pct * 100 })),
    centerLabel: "~" + (cap.sharesCurrent / 1e6).toFixed(0) + "M", centerSub: "shares",
    label: "Ownership: insiders hold roughly a third; CEO ~17%.",
  });
  $("#cap-structure").innerHTML = kvHTML([
    { k: "Shares (Q3 FY26 basic)", v: (cap.sharesBasic / 1e6).toFixed(1) + "M" },
    { k: "Shares (current est.)", v: "~" + (cap.sharesCurrent / 1e6).toFixed(0) + "M" },
    { k: "Fully diluted", v: "~" + (cap.sharesFD / 1e6).toFixed(0) + "M" },
    { k: "Options/RSUs reserved", v: pct(cap.omnibusReservedPct) + " (cap " + pct(cap.omnibusCapPct) + ")" },
    { k: "Debt", v: cap.debt },
    { k: "Financing", v: cap.financingMethod },
  ]);
  $("#financing-list").innerHTML = DATA.financing.map((f) => `
    <div class="fin">
      <span class="fin__date">${escapeHTML(f.date)}</span>
      <div class="fin__body"><p class="fin__item">${escapeHTML(f.item)}</p><p class="fin__note">${escapeHTML(f.note)}</p></div>
      <span class="fin__type">${escapeHTML(f.type)}</span>
    </div>`).join("");
}

/* ===================================================== peers & valuation */
function renderPeerTable() {
  const rows = DATA.peers.table.map((p) => ({
    _self: p.self,
    cells: [`<b>${p.ticker}</b> <span class="t-sub">${escapeHTML(p.name)}</span>`, escapeHTML(p.component), p.stage, p.mktCap, p.npv, p.irr, p.capex, p.mktNpv],
  }));
  $("#table-peers").innerHTML = tableHTML(["Company", "Chain role", "Stage", "Mkt cap", "Study NPV", "IRR", "Capex", "Mkt/NAV"], rows, { cls: "dtable--peers" });
}

function renderFootballField() {
  const ff = DATA.comps.footballField;
  const cfg = {
    rows: ff.map((r) => ({ label: r.method, low: r.low, high: r.high, mid: r.mid, upside: r.upside })),
    domainMin: 0, domainMax: 3.4, ref: state.price, valueFormat: (v) => "C$" + v.toFixed(2),
    label: "Fair-value ranges by valuation method, against the current price.",
  };
  const run = C.rangeBars($("#football-field"), cfg);
  renderFootballField._relive = () => { cfg.ref = state.price; run(); };  // move the "today" line when the live quote lands
}

function renderValuation() {
  const v = DATA.valuation, NPV = v.npv;
  let basis = "basic";
  const shares = () => (basis === "basic" ? v.sharesBasic : v.sharesFD);
  const pctDomain = []; for (let p = 3; p <= 35; p++) pctDomain.push(p / 100);
  const priceAt = (p) => (NPV * p) / shares();

  const sensCfg = {
    pct: pctDomain, price: () => pctDomain.map(priceAt), current: state.price,
    scenarios: v.scenarios.map((s) => ({ pct: s.pct, name: s.name })),
    priceFormat: price, label: "Implied share price across NAV-discount assumptions, against today's price.",
  };
  const sens = C.sensitivity($("#chart-sensitivity"), sensCfg);

  const slider = $("#val-slider"), out = $("#val-pct"), priceEl = $("#val-price"), deltaEl = $("#val-delta"), mktcapEl = $("#val-mktcap");
  function update() {
    const p = (+slider.value) / 100, pr = priceAt(p), up = pr / state.price - 1;
    out.textContent = Math.round(p * 100) + "%";
    slider.setAttribute("aria-valuetext", `${Math.round(p * 100)}% of PEA NAV → ${price(pr)}`);
    priceEl.textContent = price(pr);
    deltaEl.textContent = (up >= 0 ? "▲ +" : "▼ ") + pct(Math.abs(up), 0) + " vs. " + price(state.price) + (state.live ? " (live)" : " today");
    deltaEl.className = "val-readout__delta " + (up >= 0 ? "is-up" : "is-down");
    mktcapEl.textContent = cad(NPV * p);
    const fillPct = ((+slider.value - 3) / (35 - 3)) * 100;
    slider.style.setProperty("--fill", fillPct + "%");
    sens.setPct(p);
  }
  slider.addEventListener("input", update);
  $$(".seg__btn[data-shares]").forEach((btn) => btn.addEventListener("click", () => {
    $$(".seg__btn[data-shares]").forEach((b) => { b.classList.remove("is-on"); b.setAttribute("aria-selected", "false"); });
    btn.classList.add("is-on"); btn.setAttribute("aria-selected", "true");
    basis = btn.dataset.shares; sens.redraw(); update();
  }));

  $("#val-scenarios").innerHTML = v.scenarios.map((s) => `
    <button class="scn ${s.current ? "is-current" : ""}" data-pct="${Math.round(s.pct * 100)}" type="button">
      <span class="scn__name">${s.name}${s.current ? ' <span class="scn__tag">≈ today</span>' : ""}</span>
      <span class="scn__price">${price(s.price)}</span>
      <span class="scn__pct">${Math.round(s.pct * 100)}% of NAV · ${escapeHTML(s.label)}</span>
      <span class="scn__why">${escapeHTML(s.rationale)}</span>
    </button>`).join("");
  $$("#val-scenarios .scn").forEach((card) => card.addEventListener("click", () => { slider.value = card.dataset.pct; update(); }));

  update();
  // expose so the live feed can move the "today" reference
  renderValuation._relive = () => { sensCfg.current = state.price; sens.redraw(); update(); };
}

/* ===================================================== management */
function renderManagement() {
  const g = DATA.governance;
  $("#mgmt-highlights").innerHTML = g.highlights.map((h) => `<div class="mh"><p class="mh__v">${escapeHTML(h.v)}</p><p class="mh__k">${escapeHTML(h.k)}</p><p class="mh__n">${escapeHTML(h.note)}</p></div>`).join("");
  $("#mgmt-ratings").innerHTML = g.ratings.map((r) => `<div class="rating"><span class="rating__area">${escapeHTML(r.area)}</span>${stars(r.stars)}</div>`).join("") +
    `<div class="rating rating--overall"><span class="rating__area">Overall</span>${stars(g.overall)}</div>`;
  $("#advisory-list").innerHTML = DATA.advisory.map((a) => `
    <div class="adv"><div class="adv__top"><span class="adv__name">${escapeHTML(a.name)}</span>${stars(a.stars)}</div>
      <p class="adv__role">${escapeHTML(a.role)}</p><p class="adv__note">${escapeHTML(a.note)}</p></div>`).join("");
  const rows = g.insiders.map((i) => ({ cells: [`<b>${escapeHTML(i.name)}</b>`, escapeHTML(i.role), escapeHTML(i.bought)] }));
  $("#table-insiders").innerHTML = tableHTML(["Insider", "Role", "Open-market buying"], rows, { cls: "dtable--left" });
}

/* ===================================================== esg */
function renderEsg() {
  $("#esg-list").innerHTML = DATA.esg.map((e) => `
    <div class="esg reveal"><div class="esg__top"><span class="esg__area">${escapeHTML(e.area)}</span>${stars(e.rating)}</div>
      <p class="esg__detail">${escapeHTML(e.detail)}</p></div>`).join("");
}

/* ===================================================== roadmap & catalysts */
function renderRoadmap() {
  $("#roadmap-list").innerHTML = DATA.roadmap.map((r) => `
    <li class="rm-step ${r.done ? "is-done" : ""}">
      <span class="rm-step__dot" aria-hidden="true"></span>
      <span class="rm-step__when">${escapeHTML(r.when)}</span>
      <span class="rm-step__phase">${escapeHTML(r.phase)}</span>
      <span class="rm-step__detail">${escapeHTML(r.detail)}</span>
    </li>`).join("");
  $("#catalysts-fwd").innerHTML = DATA.forwardCatalysts.map((c) => `<li class="cf"><span class="cf__when">${escapeHTML(c.window)}</span><span class="cf__what"><b>${escapeHTML(c.event)}</b><span>${escapeHTML(c.impact)}</span></span></li>`).join("");
  $("#catalysts-past").innerHTML = DATA.catalysts.map((c) => `<li class="tl ${c.weight === "major" ? "tl--major" : ""}"><span class="tl__date">${escapeHTML(c.date)}</span><span class="tl__body"><b>${escapeHTML(c.event)}</b><span>${escapeHTML(c.note)}</span></span></li>`).join("");
}

/* ===================================================== risk */
function renderRisk() {
  const sevs = ["Critical", "High", "Medium", "Low"], probs = ["Low", "Medium", "High"];
  const sw = (s) => ({ Low: 1, Medium: 2, High: 3, Critical: 4 }[s]), pw = (p) => ({ Low: 1, Medium: 2, High: 3 }[p]);
  const zone = (x) => x >= 9 ? "hot" : x >= 5 ? "warm" : x >= 3 ? "mild" : "cool";
  let grid = '<div class="rm"><span class="rm__corner"></span>';
  probs.forEach((p) => grid += `<span class="rm__colh">${p}</span>`);
  sevs.forEach((sev) => {
    grid += `<span class="rm__rowh">${sev}</span>`;
    probs.forEach((prob) => {
      const items = DATA.risks.filter((r) => r.severity === sev && r.probability === prob).map((r) => `<span class="rm__chip">${escapeHTML(r.factor)}</span>`).join("");
      grid += `<span class="rm__cell" data-zone="${zone(sw(sev) * pw(prob))}">${items}</span>`;
    });
  });
  grid += '</div><p class="rm__axis">Probability →&nbsp;&nbsp;·&nbsp;&nbsp;Severity ↑</p>';
  $("#risk-matrix").innerHTML = grid;
  $("#risk-monitor").innerHTML = DATA.monitoring.map((m) => `
    <li class="mon"><span class="mon__metric">${escapeHTML(m.metric)}</span><span class="mon__cur">${escapeHTML(m.current)}</span><span class="mon__watch">watch: ${escapeHTML(m.watch)}</span></li>`).join("");
}

/* ===================================================== reference */
function renderReference() {
  $("#glossary").innerHTML = DATA.glossary.map((g) => `<div class="gl"><dt>${escapeHTML(g.t)}</dt><dd>${escapeHTML(g.d)}</dd></div>`).join("");
  $("#vintage-list").innerHTML = Object.values(DATA.vintage).map((v) => `<li>${escapeHTML(v)}</li>`).join("");
  $("#method-sources").innerHTML = DATA.sources.map((s) => `<li>${escapeHTML(s)}</li>`).join("");
}

/* ===================================================== live quote */
function applyLivePrice(q) {
  // q: { price, currency, change, changePct }
  state.price = q.price; state.live = true;
  $("#price-live").hidden = false;
  $("#cov-price").textContent = price(q.price);
  const chg = $("#cov-change");
  const sign = q.change >= 0 ? "+" : "−";
  chg.textContent = `${sign}${Math.abs(q.change).toFixed(2)} (${sign}${Math.abs(q.changePct).toFixed(1)}%) · 15-min delayed`;
  chg.className = "coverage__price-chg " + (q.change >= 0 ? "is-up" : "is-down");
  $("#val-current").textContent = price(q.price) + " (live)";
  // ripple: market-cap & NAV KPIs, fair-value bar, valuation model.
  // Use the same Q3 basic share count as the static C$158M baseline so the KPI
  // moves only with price, not with a share-count switch on go-live.
  const mc = q.price * DATA.capital.sharesBasic;
  $("#kpi-mktcap").innerHTML = cad(mc);
  $("#kpi-mktcap-note").innerHTML = `live · ${price(q.price)} × ${(DATA.capital.sharesBasic / 1e6).toFixed(1)}M sh (Q3)`;
  $("#kpi-nav").innerHTML = pct(mc / DATA.valuation.npv, 0);
  const fvbar = $("#cov-fvbar"); if (fvbar && fvbar._set) fvbar._set();
  if (renderValuation._relive) renderValuation._relive();
  if (renderFootballField._relive) renderFootballField._relive();
}
async function fetchQuote() {
  try {
    const r = await fetch("/api/quote", { headers: { accept: "application/json" } });
    if (!r.ok) return;
    const q = await r.json();
    // Only apply CAD quotes — never render a non-CAD price under a "C$" label.
    if (q && typeof q.price === "number" && q.price > 0 && (!q.currency || q.currency === "CAD")) applyLivePrice(q);
  } catch (e) { /* static values stand */ }
}

/* ===================================================== go */
renderCoverage();
renderThesis();
renderProject();
renderMarket();
renderSupply();
renderCharts();
renderRatios();
renderRunway();
renderCapex();
renderCapital();
renderPeerTable();
renderFootballField();
renderValuation();
renderManagement();
renderEsg();
renderRoadmap();
renderRisk();
renderReference();
fetchQuote();
