/* ============================================================================
   /api/quote — live share-price proxy (Vercel serverless, no API key).
   The browser can't call Yahoo directly (no CORS), so this fetches it
   server-side and returns a small JSON quote with permissive CORS + edge cache.
   CSE (CAD) is preferred; OTCQX (USD) is a labelled fallback. On any failure it
   returns 502 and the dashboard keeps its static, filing-dated figures.
   ========================================================================== */
const TICKERS = ["PHOS.CN", "FRSPF"]; // CSE (CAD) first, then OTCQX (USD)

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=900");
  res.setHeader("Access-Control-Allow-Origin", "*");

  for (const ticker of TICKERS) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=5d`;
      const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; phos-research/1.0)" } });
      if (!r.ok) continue;
      const data = await r.json();
      const m = data && data.chart && data.chart.result && data.chart.result[0] && data.chart.result[0].meta;
      if (!m || typeof m.regularMarketPrice !== "number") continue;
      let price = m.regularMarketPrice;
      let prevClose = m.chartPreviousClose || m.previousClose || price;
      let currency = m.currency || "CAD";
      let source = "Yahoo Finance (delayed)";

      // The report is in CAD. The OTCQX (FRSPF) fallback quotes in USD, so convert
      // it — never emit a non-CAD price under a "C$" label.
      if (currency !== "CAD") {
        const rate = await fxToCad(currency);
        if (!rate) continue; // can't convert reliably → try next ticker / fail
        price *= rate;
        prevClose *= rate;
        currency = "CAD";
        source = `Yahoo Finance (delayed · ${m.currency}→CAD)`;
      }

      const change = price - prevClose;
      return res.status(200).json({
        price,
        currency,
        prevClose,
        change,
        changePct: prevClose ? (change / prevClose) * 100 : 0,
        ticker,
        exchange: m.exchangeName || null,
        source,
      });
    } catch (e) {
      /* try the next ticker */
    }
  }
  return res.status(502).json({ error: "quote unavailable" });
}

/* USD/EUR/etc → CAD spot rate from Yahoo's FX feed (no key). Null on failure. */
async function fxToCad(from) {
  if (from === "CAD") return 1;
  try {
    const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${from}CAD=X?interval=1d&range=1d`,
      { headers: { "User-Agent": "Mozilla/5.0 (compatible; phos-research/1.0)" } });
    if (!r.ok) return null;
    const d = await r.json();
    const rate = d && d.chart && d.chart.result && d.chart.result[0] && d.chart.result[0].meta && d.chart.result[0].meta.regularMarketPrice;
    return typeof rate === "number" && rate > 0 ? rate : null;
  } catch (e) {
    return null;
  }
}
