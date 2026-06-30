# First Phosphate (CSE: PHOS) — Equity Research

A comprehensive, interactive equity-research report on **First Phosphate Corp. (CSE: PHOS · OTCQX: FRSPF · FSE: KD0)** — a pre-revenue LFP-battery phosphate developer in Saguenay, Québec.

🔗 **Live:** [phos-analysis.vercel.app](https://phos-analysis.vercel.app)

Built as a zero-build static site with one serverless function for the live quote. Every fundamental traces to SEDAR+ filings; the headline price is live.

## What's inside

A full initiating-coverage-style note, not a sample dashboard:

| # | Section | |
|---|---|---|
| — | **Masthead** | Coverage summary box · live price · fair-value football field |
| 01 | **Snapshot** | KPIs (market cap & NAV multiple update from the live price) |
| 02 | **Thesis** | Bull / base / bear on the LFP premium |
| 03 | **Company & project** | Bégin-Lamarche PEA economics, resource confidence, mine-to-battery value chain |
| 04 | **Market & industry** | LFP market sizing, demand drivers, China concentration, critical-mineral policy |
| 05 | **Supply chain** | Where PHOS sits in the Québec battery-materials cluster |
| 06 | **Financials** | Balance sheet, net loss, opex mix, key ratios |
| 07 | **Cash & capital** | Runway scenarios, the C$994M capex gap, dilution, cap table, financing |
| 08 | **Valuation** | Peer comps, a multi-method fair-value range, and an **interactive NAV model** |
| 09 | **Management** | Insider buying, governance scorecard, the advisory bench |
| 10 | **ESG** | Permitting, Indigenous partnership, social licence |
| 11 | **Roadmap** | Stage gates to production + catalyst timeline |
| 12 | **Risk** | Severity × probability matrix + monitoring checklist |
| 13 | **Bottom line** + reference | Conclusion, glossary, sources, data vintage |

## Stack

Deliberately **zero-build** — no framework, no bundler, no chart CDN:

- **HTML + CSS** — a small token-driven design system (`tokens.css` / `base.css`) shared with [samjo.me](https://samjo.me), restyled here into a cool-white "research terminal" via `dash.css` (Inter display, serif body, tabular-mono data). Five themes; white is default.
- **Vanilla ES modules** — `charts.js` is a hand-rolled SVG chart toolkit (line/area, bars, ranked bars, donut, football-field range bars, an interactive sensitivity curve) that re-themes live and re-flows on resize.
- **One serverless function** — `api/quote.js` proxies the live share price.
- Full SEO + Open Graph, ⌘K command palette, and accessible-by-default markup (semantic tables, `role="img"` charts, reduced-motion, keyboard nav).

## Live data vs. point-in-time data

- **Live (every load):** share price → market cap → Mkt-cap/NAV → the valuation reference line, via `/api/quote` (a Vercel function that reads Yahoo Finance server-side — **no API key**). If the feed is unavailable it falls back to the filing-dated figure and labels it as such.
- **Point-in-time (versioned):** every fundamental is extracted from [`data.xlsx`](./data.xlsx) into a committed `scripts/data.js` at build time, so the page and the model can never drift. A [CI check](./.github/workflows/data-check.yml) enforces that on every push.

This is the industry-standard posture for research: the headline quote is current; the analysis is a dated, reproducible snapshot. To refresh fundamentals for a new quarter: drop the new SEDAR+ figures into `data.xlsx`, run the extractor, and push.

## Data sources

Official **SEDAR+ filings** — FY2024 & FY2025 audited annuals, Q1–Q3 FY2026 interims and MDAs — plus public peer/market data (Mar 2026). [**Download the model →**](./data/phos-financial-model.xlsx)

## Develop

```bash
python3 -m http.server 8000              # → http://localhost:8000 (live quote needs Vercel)
pip install -r build/requirements.txt
python3 build/extract.py                 # regenerate scripts/data.js from data.xlsx
```

## Deploy

Static site + one function on **Vercel** (Framework = Other, no build). `vercel.json` sets clean URLs, security headers, and cache policy (revalidate CSS/JS, immutable fonts).

## Disclaimer

For **research and education only — not investment advice.** Pre-revenue exploration companies carry extreme risk, including total loss of capital. All data is from public filings and may contain errors. Do your own research.

## Author

**Samuel Jo** — [samjo.me](https://samjo.me) · [GitHub](https://github.com/squireaintready) · [LinkedIn](https://linkedin.com/in/samuel-jo)
