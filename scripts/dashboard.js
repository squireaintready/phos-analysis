/* ============================================================================
   dashboard.js — orchestrates the PHOS dashboard.
   Imports the committed data + the SVG chart toolkit + the shared chrome,
   then renders every panel: thesis, charts, tables, the interactive valuation
   model, governance, risk matrix, and catalysts. All numbers trace to data.js
   (generated from data.xlsx), so the page and the model never drift.
   ========================================================================== */
import { DATA } from "./data.js";
import * as C from "./charts.js";
import { initChrome, escapeHTML } from "./main.js";

/* ---------------- formatters ---------------- */
const cad = (v) => (v < 0 ? "−" : "") + "C$" + C.short(Math.abs(v));
const pct = (v, d = 0) => (v * 100).toFixed(d) + "%";
const mult = (v) => v.toFixed(2) + "×";
const price = (v) => "C$" + v.toFixed(2);
const $ = (s, r = document) => r.querySelector(s);

/* ---------------- chrome (theme / nav / ⌘K / counters / fit) ---------------- */
initChrome({
  cmdkLinks: [
    { group: "Open", title: "First Phosphate — investor site", sub: "firstphosphate.com", url: "https://firstphosphate.com/" },
    { group: "Open", title: "SEDAR+ filings", sub: "sedarplus.ca", url: "https://www.sedarplus.ca/" },
    { group: "Open", title: "Download the model (.xlsx)", sub: "phos-financial-model.xlsx", icon: "doc", url: "/data/phos-financial-model.xlsx" },
    { group: "Open", title: "Source on GitHub", sub: "squireaintready/phos-analysis", url: "https://github.com/squireaintready/phos-analysis" },
    { group: "Open", title: "Samuel Jo — portfolio", sub: "samjo.me", url: "https://samjo.me/" },
  ],
});

/* ---------------- thesis lists ---------------- */
function renderThesis() {
  ["bull", "base", "bear"].forEach((k) => {
    const ul = $(`[data-thesis="${k}"]`);
    if (ul) ul.innerHTML = DATA.thesis[k].map((t) => `<li>${escapeHTML(t)}</li>`).join("");
  });
}

/* ---------------- table helper ---------------- */
function tableHTML(headers, rows, opts = {}) {
  const head = "<thead><tr>" + headers.map((h, i) => `<th${i === 0 ? ' scope="col"' : ' scope="col" class="num"'}>${h}</th>`).join("") + "</tr></thead>";
  const body = "<tbody>" + rows.map((r) => "<tr" + (r._self ? ' class="is-self"' : "") + ">" + r.cells.map((c, i) => i === 0 ? `<th scope="row">${c}</th>` : `<td class="num">${c}</td>`).join("") + "</tr>").join("") + "</tbody>";
  return `<table class="dtable${opts.cls ? " " + opts.cls : ""}">${head}${body}</table>`;
}

/* ---------------- charts ---------------- */
function renderCharts() {
  const f = DATA.financials, b = DATA.burn;

  // Balance-sheet growth — assets / cash / equity over 5 periods
  C.lineArea($("#chart-balance"), {
    x: f.periods,
    series: [
      { name: "Total assets", values: f.totalAssets },
      { name: "Cash", values: f.cash, color: "--up" },
      { name: "Equity", values: f.equity, color: "--text-mute" },
    ],
    yFormat: C.short, tipFormat: cad,
    label: "Balance-sheet growth: total assets, cash and equity across five periods, all rising sharply.",
  });

  // Quarterly net loss — 8 comparable quarters
  C.bars($("#chart-netloss"), {
    x: b.quarters, values: b.netLoss, signed: true,
    yFormat: C.short, tipFormat: cad,
    label: "Quarterly net loss across eight quarters; the burn steps up sharply in the latest quarter.",
  });

  // FY2025 operating-expense composition
  C.donut($("#chart-expenses"), {
    slices: f.expenseBreakdownFY2025,
    centerLabel: cad(f.expenseBreakdownFY2025.reduce((a, s) => a + s.value, 0)),
    centerSub: "FY2025 opex",
    label: "FY2025 operating expenses by category — dominated by exploration and metallurgy.",
  });

  // Cash balance — 8 quarters
  C.lineArea($("#chart-cash"), {
    x: b.quarters,
    series: [{ name: "Cash", values: b.cashBalance }],
    yFormat: C.short, tipFormat: cad,
    label: "Cash balance across eight quarters; equity financings repeatedly refill the balance.",
  });

  // Dilution — shares outstanding ramp
  C.bars($("#chart-dilution"), {
    x: b.quarters, values: b.sharesOutstanding,
    yFormat: C.short, tipFormat: (v) => (v / 1e6).toFixed(1) + "M shares",
    label: "Shares outstanding more than double across eight quarters — heavy dilution.",
  });

  // Peers — market cap / NAV (lower = cheaper)
  C.hbars($("#chart-peers-nav"), {
    rows: DATA.peers.navDiscount.map((p) => ({ label: p.ticker, value: p.mktNpv, self: p.self })),
    valueFormat: mult,
    label: "Market cap as a multiple of study NAV; PHOS sits among the cheapest.",
  });

  // Peers — after-tax IRR
  C.hbars($("#chart-peers-irr"), {
    rows: DATA.peers.irr.map((p) => ({ label: p.ticker, value: p.irr, self: p.self })),
    valueFormat: (v) => pct(v, 0),
    label: "After-tax IRR by project; PHOS carries the highest in the peer group.",
  });
}

/* ---------------- ratios table ---------------- */
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

/* ---------------- runway scenarios ---------------- */
function renderRunway() {
  const r = DATA.runway;
  const maxMo = Math.max(...r.scenarios.map((s) => s.months));
  $("#runway-scenarios").innerHTML = r.scenarios.map((s) => `
    <div class="scenario">
      <div class="scenario__top"><span class="scenario__name">${s.name}</span><span class="scenario__mo">${s.months.toFixed(0)} mo</span></div>
      <div class="scenario__track"><span class="scenario__bar" style="width:${(s.months / maxMo) * 100}%"></span></div>
      <p class="scenario__note">${cad(s.qBurn)}/qtr · ${escapeHTML(s.note)}</p>
    </div>`).join("") +
    `<p class="scenario__foot">Based on ~${cad(r.estCashJan2026)} estimated cash (Jan 2026).</p>`;
}

/* ---------------- capex funding gap ---------------- */
function renderCapex() {
  const g = DATA.capexGap;
  const items = g.items.map((it) => `
    <li class="wf__item"><span class="wf__bar" style="width:${(it.value / g.totalRequired) * 100}%"></span>
      <span class="wf__lab">${escapeHTML(it.label)}</span><span class="wf__val">${cad(it.value)}</span></li>`).join("");
  $("#capex-gap").innerHTML = `
    <ul class="wf__list">${items}</ul>
    <div class="wf__sum">
      <div class="wf__row"><span>Total capital required</span><b>${cad(g.totalRequired)}</b></div>
      <div class="wf__row wf__row--ok"><span>Available (cash less 2-yr burn)</span><b>${cad(g.availableForCapex)}</b></div>
      <div class="wf__row wf__row--gap"><span>Funding gap</span><b>−${cad(g.fundingGap).replace("C$", "C$")}</b></div>
    </div>
    <p class="wf__note">Needs project finance, debt, JV and/or further equity to close.</p>`;
}

/* ---------------- peer table ---------------- */
function renderPeerTable() {
  const rows = DATA.peers.table.map((p) => ({
    _self: p.self,
    cells: [`<b>${p.ticker}</b> <span class="t-sub">${escapeHTML(p.name)}</span>`, escapeHTML(p.component), p.stage, p.mktCap, p.npv, p.irr, p.capex, p.mktNpv],
  }));
  $("#table-peers").innerHTML = tableHTML(
    ["Company", "Chain role", "Stage", "Mkt cap", "Study NPV", "IRR", "Capex", "Mkt/NAV"], rows, { cls: "dtable--peers" });
}

/* ---------------- valuation (interactive) ---------------- */
function renderValuation() {
  const v = DATA.valuation;
  const NPV = v.npv, current = v.currentPrice;
  let basis = "basic";
  const shares = () => (basis === "basic" ? v.sharesBasic : v.sharesFD);

  // smooth pct domain 3% → 35%
  const pctDomain = [];
  for (let p = 3; p <= 35; p++) pctDomain.push(p / 100);
  const priceAt = (p) => (NPV * p) / shares();

  const sens = C.sensitivity($("#chart-sensitivity"), {
    pct: pctDomain,
    price: () => pctDomain.map(priceAt),
    current,
    scenarios: v.scenarios.map((s) => ({ pct: s.pct, name: s.name })),
    priceFormat: price,
    label: "Implied share price across NAV-discount assumptions, against today's price.",
  });

  const slider = $("#val-slider"), out = $("#val-pct"), priceEl = $("#val-price"), deltaEl = $("#val-delta"), mktcapEl = $("#val-mktcap");
  function update() {
    const p = (+slider.value) / 100;
    const pr = priceAt(p);
    const up = pr / current - 1;
    out.textContent = Math.round(p * 100) + "%";
    priceEl.textContent = price(pr);
    deltaEl.textContent = (up >= 0 ? "▲ +" : "▼ ") + pct(Math.abs(up), 0) + " vs. C$1.05 today";
    deltaEl.className = "val-readout__delta " + (up >= 0 ? "is-up" : "is-down");
    mktcapEl.textContent = cad(NPV * p);
    sens.setPct(p);
  }
  slider.addEventListener("input", update);

  // basis toggle
  document.querySelectorAll(".seg__btn[data-shares]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".seg__btn[data-shares]").forEach((b) => { b.classList.remove("is-on"); b.setAttribute("aria-selected", "false"); });
      btn.classList.add("is-on"); btn.setAttribute("aria-selected", "true");
      basis = btn.dataset.shares;
      sens.redraw(); update();
    });
  });

  // scenario cards (click to set the slider)
  $("#val-scenarios").innerHTML = v.scenarios.map((s) => `
    <button class="scn ${s.current ? "is-current" : ""}" data-pct="${Math.round(s.pct * 100)}" type="button">
      <span class="scn__name">${s.name}${s.current ? ' <span class="scn__tag">≈ today</span>' : ""}</span>
      <span class="scn__price">${price(s.price)}</span>
      <span class="scn__pct">${Math.round(s.pct * 100)}% of NAV · ${escapeHTML(s.label)}</span>
      <span class="scn__why">${escapeHTML(s.rationale)}</span>
    </button>`).join("");
  $("#val-scenarios").querySelectorAll(".scn").forEach((card) => {
    card.addEventListener("click", () => { slider.value = card.dataset.pct; update(); });
  });

  update();
}

/* ---------------- management ---------------- */
function renderManagement() {
  const g = DATA.governance;
  $("#mgmt-highlights").innerHTML = g.highlights.map((h) => `
    <div class="mh">
      <p class="mh__v">${escapeHTML(h.v)}</p>
      <p class="mh__k">${escapeHTML(h.k)}</p>
      <p class="mh__n">${escapeHTML(h.note)}</p>
    </div>`).join("");

  const stars = (n) => "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n);
  $("#mgmt-ratings").innerHTML = g.ratings.map((r) => `
    <div class="rating">
      <span class="rating__area">${escapeHTML(r.area)}</span>
      <span class="rating__stars" aria-label="${r.stars} of 5"><span class="rating__on" style="width:${(r.stars / 5) * 100}%">★★★★★</span><span class="rating__off">★★★★★</span></span>
    </div>`).join("") +
    `<div class="rating rating--overall"><span class="rating__area">Overall</span><span class="rating__stars" aria-label="${g.overall} of 5"><span class="rating__on" style="width:${(g.overall / 5) * 100}%">★★★★★</span><span class="rating__off">★★★★★</span></span></div>`;

  const rows = g.insiders.map((i) => ({ cells: [`<b>${escapeHTML(i.name)}</b>`, escapeHTML(i.role), escapeHTML(i.bought)] }));
  $("#table-insiders").innerHTML = tableHTML(["Insider", "Role", "Open-market buying"], rows, { cls: "dtable--left" });
}

/* ---------------- risk matrix + catalysts ---------------- */
function renderRisk() {
  const sevs = ["Critical", "High", "Medium", "Low"];   // rows, top→bottom
  const probs = ["Low", "Medium", "High"];               // cols, left→right
  const cell = (sev, prob) => DATA.risks.filter((r) => r.severity === sev && r.probability === prob);
  let grid = '<div class="rm">';
  grid += '<span class="rm__corner"></span>';
  probs.forEach((p) => grid += `<span class="rm__colh">${p}</span>`);
  sevs.forEach((sev) => {
    grid += `<span class="rm__rowh">${sev}</span>`;
    probs.forEach((prob) => {
      const zone = (DATA.risks.length && (sevWeight(sev) * probWeight(prob)));
      const items = cell(sev, prob).map((r) => `<span class="rm__chip">${escapeHTML(r.factor)}</span>`).join("");
      grid += `<span class="rm__cell" data-zone="${zoneClass(sevWeight(sev), probWeight(prob))}">${items}</span>`;
    });
  });
  grid += "</div>";
  grid += '<p class="rm__axis">Probability →&nbsp;&nbsp;·&nbsp;&nbsp;Severity ↑</p>';
  $("#risk-matrix").innerHTML = grid;

  $("#catalysts-fwd").innerHTML = DATA.forwardCatalysts.map((c) => `
    <li class="cf"><span class="cf__when">${escapeHTML(c.window)}</span><span class="cf__what"><b>${escapeHTML(c.event)}</b><span>${escapeHTML(c.impact)}</span></span></li>`).join("");

  $("#catalysts-past").innerHTML = DATA.catalysts.map((c) => `
    <li class="tl ${c.weight === "major" ? "tl--major" : ""}">
      <span class="tl__date">${escapeHTML(c.date)}</span>
      <span class="tl__body"><b>${escapeHTML(c.event)}</b><span>${escapeHTML(c.note)}</span></span>
    </li>`).join("");
}
function sevWeight(s) { return { Low: 1, Medium: 2, High: 3, Critical: 4 }[s]; }
function probWeight(p) { return { Low: 1, Medium: 2, High: 3 }[p]; }
function zoneClass(sw, pw) { const x = sw * pw; return x >= 9 ? "hot" : x >= 5 ? "warm" : x >= 3 ? "mild" : "cool"; }

/* ---------------- methodology sources ---------------- */
function renderSources() {
  $("#method-sources").innerHTML = DATA.sources.map((s) => `<li>${escapeHTML(s)}</li>`).join("");
}

/* ---------------- go ---------------- */
renderThesis();
renderCharts();
renderRatios();
renderRunway();
renderCapex();
renderPeerTable();
renderValuation();
renderManagement();
renderRisk();
renderSources();
