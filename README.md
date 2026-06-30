# First Phosphate (CSE: PHOS) — Equity Research Dashboard

An interactive, static equity-research dashboard for **First Phosphate Corp. (CSE: PHOS · OTCQX: FRSPF · FSE: KD0)** — a pre-revenue LFP-battery phosphate developer in Saguenay, Québec.

🔗 **Live:** [phos-analysis.vercel.app](https://phos-analysis.vercel.app)

It reads the story straight from the filings: the balance sheet, the cash burn and runway, the peer group, an interactive NAV valuation model, governance, and risk — every figure traced to SEDAR+ filings.

## What's inside

| Section | What it shows |
|---|---|
| **Snapshot** | Market cap, cash, runway, Mkt-cap/NAV, net loss, dilution — at a glance |
| **Thesis** | The bull / base / bear cases on the LFP premium |
| **Financials** | Balance-sheet growth, quarterly net loss, FY2025 opex mix, key ratios |
| **Cash & runway** | Cash balance over eight quarters, runway scenarios, the C$994M capex gap, dilution |
| **Peers** | Mkt-cap/NAV and IRR vs. the Québec LFP cluster (DAN, NMG, PMET, LCE) |
| **Valuation** | An **interactive** NAV-discount slider → implied share price vs. today |
| **Management** | Insider buying, 100%-equity compensation, a governance scorecard |
| **Risk & catalysts** | A severity × probability matrix and a catalyst timeline |

## Stack

Deliberately **zero-build and dependency-free** — no framework, no CDN, no bundler:

- **HTML + CSS** — a small editorial design system (`tokens.css` / `base.css`) shared with [samjo.me](https://samjo.me), plus `dash.css`
- **Vanilla ES modules** — `charts.js` is a hand-rolled SVG chart toolkit (line/area, bars, ranked bars, donut, an interactive sensitivity curve) that re-themes live and re-flows on resize
- **[Pretext](https://github.com/chenglou/pretext)** — measures and sizes the display type to its column, live in the browser
- **Five themes**, a ⌘K command palette, full SEO + Open Graph, and accessible-by-default markup (semantic tables, `role="img"` charts, reduced-motion, keyboard nav)

The financial data lives in [`data.xlsx`](./data.xlsx) (the verified model) and is extracted at build time into a committed `scripts/data.js` — so the page and the model can never drift.

## Data & method

All figures are sourced from official **SEDAR+ filings**:

- FY2024 & FY2025 audited annual financial statements
- Q1–Q3 FY2026 interim financial statements
- Management Discussion & Analysis (Q1–Q3 FY2026)
- Peer and market data from public sources (Mar 2026)

[**Download the model →**](./data/phos-financial-model.xlsx)

## Develop

No build step. Serve the folder and open it:

```bash
python3 -m http.server 8000      # → http://localhost:8000
```

Regenerate the data module after editing `data.xlsx`:

```bash
pip install -r build/requirements.txt
python3 build/extract.py          # → writes scripts/data.js
```

## Deploy

Static site on **Vercel** (Framework = Other, no build command). `vercel.json` sets clean URLs, cache headers, and security headers. Any static host works equally well.

## Disclaimer

For **research and education only — not investment advice.** Pre-revenue exploration companies carry extreme risk, including total loss of capital. All data is from public filings and may contain errors. Do your own research.

## Author

**Samuel Jo** — [samjo.me](https://samjo.me) · [GitHub](https://github.com/squireaintready) · [LinkedIn](https://linkedin.com/in/samuel-jo)
