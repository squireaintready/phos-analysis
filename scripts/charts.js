/* ============================================================================
   charts.js — a tiny dependency-free SVG chart toolkit for the PHOS dashboard.
   No CDN, no build: every chart is plain <svg> drawn from the committed data.
   Charts read their palette from the live CSS custom properties, so they
   re-theme instantly with the five-theme picker, and re-flow on resize.
   Each chart is accessible (role="img" + summary label) and animates in once,
   honouring prefers-reduced-motion.
   ========================================================================== */

const NS = "http://www.w3.org/2000/svg";
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const registry = new Set();        // { el, draw } — redrawn on resize + theme change

/* ---- small helpers ---- */
function el(tag, attrs = {}, kids = []) {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
  for (const c of [].concat(kids)) if (c) n.appendChild(c);
  return n;
}
function cssvar(name, node = document.documentElement) {
  return getComputedStyle(node).getPropertyValue(name).trim();
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;

/* "nice" axis ticks spanning [min,max] */
function ticks(min, max, count = 5) {
  if (min === max) { max = min + 1; }
  const span = max - min;
  const step0 = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(step0)));
  const norm = step0 / mag;
  const step = (norm >= 7.5 ? 10 : norm >= 3.5 ? 5 : norm >= 1.5 ? 2 : 1) * mag;
  const start = Math.floor(min / step) * step;
  const end = Math.ceil(max / step) * step;
  const out = [];
  for (let v = start; v <= end + step * 1e-6; v += step) out.push(Math.round(v / step) * step);
  return out;
}

/* palette resolved from the active theme */
function palette(host) {
  const root = host || document.documentElement;
  return {
    ink: cssvar("--text", root),
    dim: cssvar("--text-dim", root),
    mute: cssvar("--text-mute", root),
    grid: cssvar("--border", root),
    gridStrong: cssvar("--border-strong", root),
    surface: cssvar("--surface", root),
    surface2: cssvar("--surface-2", root),
    brand: cssvar("--proj-ink", root) || cssvar("--accent", root),
    brandVivid: cssvar("--proj", root) || cssvar("--accent", root),
    accent: cssvar("--accent", root),
    up: cssvar("--up", root),
    down: cssvar("--down", root),
  };
}

/* a tooltip element shared per chart host */
function tooltip(host) {
  let tip = host.querySelector(".chart-tip");
  if (!tip) {
    tip = document.createElement("div");
    tip.className = "chart-tip";
    tip.hidden = true;
    host.appendChild(tip);
  }
  return tip;
}

/* mount: draw now, and re-draw on resize / theme change */
function mount(host, draw) {
  const entry = { el: host, draw };
  registry.add(entry);
  const run = () => {
    const w = host.clientWidth;
    if (w > 0) draw(w);
  };
  run();
  if ("ResizeObserver" in window) {
    let raf = 0, lastW = host.clientWidth;
    const ro = new ResizeObserver(() => {
      const w = host.clientWidth;
      if (Math.abs(w - lastW) < 2) return;        // ignore sub-pixel / vertical-only changes
      lastW = w;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(run);
    });
    ro.observe(host);
  }
  return run;
}

/* one global theme listener redraws every mounted chart */
document.addEventListener("themechanged", () => {
  registry.forEach((e) => { const w = e.el.clientWidth; if (w > 0) e.draw(w); });
});

/* number → short axis label (1.59B, 20.0M, 740K) */
function short(v) {
  const a = Math.abs(v);
  if (a >= 1e9) return (v / 1e9).toFixed(a >= 1e10 ? 0 : 2).replace(/\.0+$/, "") + "B";
  if (a >= 1e6) return (v / 1e6).toFixed(a >= 1e7 ? 0 : 1).replace(/\.0$/, "") + "M";
  if (a >= 1e3) return Math.round(v / 1e3) + "K";
  return String(Math.round(v));
}

/* ============================================================ line / area */
export function lineArea(host, cfg) {
  // cfg: { x:[labels], series:[{name,values,color?,fill?,dashed?}], yFormat, label }
  host.classList.add("chart");
  host.setAttribute("role", "img");
  if (cfg.label) host.setAttribute("aria-label", cfg.label);
  const tip = tooltip(host);
  const yFmt = cfg.yFormat || short;

  const draw = (W) => {
    const p = palette(host);
    const H = cfg.height || Math.max(190, Math.min(280, Math.round(W * 0.42)));
    const m = { t: 14, r: 14, b: 28, l: 46 };
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    const all = cfg.series.flatMap((s) => s.values).filter((v) => v != null);
    let lo = Math.min(0, ...all), hi = Math.max(...all);
    const tk = ticks(lo, hi, 4); lo = tk[0]; hi = tk[tk.length - 1];
    const n = cfg.x.length;
    const X = (i) => m.l + (n === 1 ? iw / 2 : (i / (n - 1)) * iw);
    const Y = (v) => m.t + ih - ((v - lo) / (hi - lo)) * ih;

    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, width: W, height: H, class: "chart-svg" });

    // gridlines + y labels
    tk.forEach((t) => {
      const y = Y(t);
      svg.appendChild(el("line", { x1: m.l, x2: W - m.r, y1: y, y2: y, stroke: p.grid, "stroke-width": 1, "shape-rendering": "crispEdges", opacity: t === 0 ? 0.9 : 0.5 }));
      const tx = el("text", { x: m.l - 8, y: y + 3.5, "text-anchor": "end", class: "chart-axis" }); tx.textContent = yFmt(t);
      tx.setAttribute("fill", p.mute); svg.appendChild(tx);
    });
    // x labels
    cfg.x.forEach((lab, i) => {
      const tx = el("text", { x: X(i), y: H - 9, "text-anchor": "middle", class: "chart-axis" });
      tx.textContent = lab; tx.setAttribute("fill", p.mute); svg.appendChild(tx);
    });

    // series
    cfg.series.forEach((s, si) => {
      const color = s.color ? cssvar(s.color, host) || s.color : (si === 0 ? p.brand : p.accent);
      const pts = s.values.map((v, i) => (v == null ? null : [X(i), Y(v)]));
      const defined = pts.filter(Boolean);
      if (!defined.length) return;
      const dline = defined.map((pt, i) => (i ? "L" : "M") + pt[0].toFixed(1) + " " + pt[1].toFixed(1)).join(" ");
      if (s.fill !== false) {
        const area = dline + ` L ${defined[defined.length - 1][0].toFixed(1)} ${Y(lo)} L ${defined[0][0].toFixed(1)} ${Y(lo)} Z`;
        const gid = "g" + si + "-" + Math.round(W);
        const grad = el("linearGradient", { id: gid, x1: 0, y1: 0, x2: 0, y2: 1 }, [
          el("stop", { offset: "0%", "stop-color": color, "stop-opacity": si === 0 ? 0.22 : 0.10 }),
          el("stop", { offset: "100%", "stop-color": color, "stop-opacity": 0 }),
        ]);
        svg.appendChild(el("defs", {}, [grad]));
        svg.appendChild(el("path", { d: area, fill: `url(#${gid})` }));
      }
      const path = el("path", { d: dline, fill: "none", stroke: color, "stroke-width": 2.4, "stroke-linejoin": "round", "stroke-linecap": "round", class: "chart-line" + (s.dashed ? " is-dashed" : "") });
      if (s.dashed) path.setAttribute("stroke-dasharray", "5 5");
      svg.appendChild(path);
      // end marker
      const last = defined[defined.length - 1];
      svg.appendChild(el("circle", { cx: last[0], cy: last[1], r: 3.4, fill: color, stroke: p.surface, "stroke-width": 1.5 }));
    });

    // legend (if >1 series)
    if (cfg.series.length > 1) {
      const lg = el("g", {});
      let lx = m.l;
      cfg.series.forEach((s, si) => {
        const color = s.color ? cssvar(s.color, host) || s.color : (si === 0 ? p.brand : p.accent);
        lg.appendChild(el("rect", { x: lx, y: m.t - 6, width: 10, height: 3, rx: 1.5, fill: color }));
        const t = el("text", { x: lx + 15, y: m.t - 2, class: "chart-legend" }); t.textContent = s.name; t.setAttribute("fill", p.dim);
        lg.appendChild(t);
        lx += 26 + s.name.length * 6.6;
      });
      svg.appendChild(lg);
    }

    // hover layer
    const hoverLine = el("line", { y1: m.t, y2: m.t + ih, stroke: p.gridStrong, "stroke-width": 1, "shape-rendering": "crispEdges", opacity: 0 });
    svg.appendChild(hoverLine);
    const dots = cfg.series.map((s, si) => {
      const color = s.color ? cssvar(s.color, host) || s.color : (si === 0 ? p.brand : p.accent);
      const c = el("circle", { r: 4, fill: color, stroke: p.surface, "stroke-width": 2, opacity: 0 });
      svg.appendChild(c); return c;
    });
    const overlay = el("rect", { x: m.l, y: m.t, width: iw, height: ih, fill: "transparent", style: "cursor:crosshair" });
    svg.appendChild(overlay);
    const move = (ev) => {
      const r = svg.getBoundingClientRect();
      const px = (ev.touches ? ev.touches[0].clientX : ev.clientX) - r.left;
      const sx = px * (W / r.width);
      const i = clamp(Math.round(((sx - m.l) / iw) * (n - 1)), 0, n - 1);
      hoverLine.setAttribute("x1", X(i)); hoverLine.setAttribute("x2", X(i)); hoverLine.setAttribute("opacity", 0.6);
      let rows = "";
      cfg.series.forEach((s, si) => {
        const v = s.values[i];
        dots[si].setAttribute("opacity", v == null ? 0 : 1);
        if (v != null) { dots[si].setAttribute("cx", X(i)); dots[si].setAttribute("cy", Y(v)); }
        const color = s.color ? cssvar(s.color, host) || s.color : (si === 0 ? p.brand : p.accent);
        if (v != null) rows += `<span class="chart-tip__row"><i style="background:${color}"></i>${s.name ? s.name + " " : ""}<b>${(cfg.tipFormat || yFmt)(v)}</b></span>`;
      });
      tip.innerHTML = `<span class="chart-tip__x">${cfg.x[i]}</span>${rows}`;
      tip.hidden = false;
      const tw = tip.offsetWidth, host_r = host.getBoundingClientRect();
      let left = (X(i) / W) * r.width + (r.left - host_r.left) - tw / 2;
      left = clamp(left, 4, host.clientWidth - tw - 4);
      tip.style.left = left + "px";
      tip.style.top = (m.t / H) * r.height + (r.top - host_r.top) - 4 + "px";
    };
    const leave = () => { tip.hidden = true; hoverLine.setAttribute("opacity", 0); dots.forEach((d) => d.setAttribute("opacity", 0)); };
    overlay.addEventListener("pointermove", move);
    overlay.addEventListener("pointerleave", leave);
    overlay.addEventListener("touchmove", move, { passive: true });
    overlay.addEventListener("touchend", leave);

    host.querySelector(".chart-svg")?.remove();
    host.insertBefore(svg, tip);
    if (!reduced) svg.classList.add("is-enter");
  };
  return mount(host, draw);
}

/* ==================================================================== bars */
export function bars(host, cfg) {
  // cfg: { x:[labels], values:[], color?, signed?, yFormat, label, tipFormat }
  host.classList.add("chart");
  host.setAttribute("role", "img");
  if (cfg.label) host.setAttribute("aria-label", cfg.label);
  const tip = tooltip(host);
  const yFmt = cfg.yFormat || short;

  const draw = (W) => {
    const p = palette(host);
    const H = cfg.height || Math.max(190, Math.min(260, Math.round(W * 0.42)));
    const m = { t: 14, r: 14, b: 28, l: 46 };
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    let lo = Math.min(0, ...cfg.values), hi = Math.max(0, ...cfg.values);
    const tk = ticks(lo, hi, 4); lo = tk[0]; hi = tk[tk.length - 1];
    const n = cfg.values.length;
    const Y = (v) => m.t + ih - ((v - lo) / (hi - lo)) * ih;
    const bw = (iw / n) * 0.62;
    const X = (i) => m.l + (i + 0.5) * (iw / n);
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, width: W, height: H, class: "chart-svg" });

    tk.forEach((t) => {
      const y = Y(t);
      svg.appendChild(el("line", { x1: m.l, x2: W - m.r, y1: y, y2: y, stroke: p.grid, "stroke-width": 1, "shape-rendering": "crispEdges", opacity: t === 0 ? 0.9 : 0.45 }));
      const tx = el("text", { x: m.l - 8, y: y + 3.5, "text-anchor": "end", class: "chart-axis" }); tx.textContent = yFmt(t); tx.setAttribute("fill", p.mute); svg.appendChild(tx);
    });
    const zero = Y(0);
    cfg.values.forEach((v, i) => {
      const color = cfg.signed ? (v < 0 ? p.down : p.up) : (cfg.color ? cssvar(cfg.color, host) || cfg.color : p.brand);
      const y = Y(v), h = Math.abs(y - zero);
      const rect = el("rect", { x: X(i) - bw / 2, y: Math.min(y, zero), width: bw, height: Math.max(1, h), rx: 2, fill: color, class: "chart-bar" });
      rect.style.setProperty("--bar-h", Math.max(1, h) + "px");
      rect.style.setProperty("--bar-y", Math.min(y, zero) + "px");
      rect.style.setProperty("--bar-zero", zero + "px");
      rect.addEventListener("pointerenter", () => {
        rect.setAttribute("opacity", 0.82);
        tip.innerHTML = `<span class="chart-tip__x">${cfg.x[i]}</span><span class="chart-tip__row"><b>${(cfg.tipFormat || yFmt)(v)}</b></span>`;
        tip.hidden = false;
        const tw = tip.offsetWidth;
        tip.style.left = clamp((X(i) / W) * host.clientWidth - tw / 2, 4, host.clientWidth - tw - 4) + "px";
        tip.style.top = (Math.min(y, zero) / H) * (cfg.height ? H : host.querySelector(".chart-svg").getBoundingClientRect().height) - 6 + "px";
      });
      rect.addEventListener("pointerleave", () => { rect.removeAttribute("opacity"); tip.hidden = true; });
      svg.appendChild(rect);
    });
    cfg.x.forEach((lab, i) => {
      const tx = el("text", { x: X(i), y: H - 9, "text-anchor": "middle", class: "chart-axis" }); tx.textContent = lab; tx.setAttribute("fill", p.mute); svg.appendChild(tx);
    });
    host.querySelector(".chart-svg")?.remove();
    host.insertBefore(svg, tip);
    if (!reduced) svg.classList.add("is-enter-bars");
  };
  return mount(host, draw);
}

/* ====================================================== horizontal bars */
export function hbars(host, cfg) {
  // cfg: { rows:[{label, value, self?, color?}], valueFormat, label, max? }
  host.classList.add("chart");
  host.setAttribute("role", "img");
  if (cfg.label) host.setAttribute("aria-label", cfg.label);
  const vFmt = cfg.valueFormat || ((v) => String(v));

  const draw = (W) => {
    const p = palette(host);
    const rows = cfg.rows;
    const rowH = 34, gap = 10, padT = 6;
    const H = padT * 2 + rows.length * rowH + (rows.length - 1) * gap;
    const labelW = Math.min(116, Math.max(76, Math.round(W * 0.26)));
    const valW = 58;
    const trackX = labelW + 10, trackW = W - trackX - valW;
    const max = cfg.max || Math.max(...rows.map((r) => r.value)) * 1.02;
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, width: W, height: H, class: "chart-svg" });

    rows.forEach((r, i) => {
      const y = padT + i * (rowH + gap);
      const cy = y + rowH / 2;
      const color = r.self ? p.brand : (r.color ? cssvar(r.color, host) || r.color : p.gridStrong);
      const lab = el("text", { x: labelW, y: cy + 4, "text-anchor": "end", class: "chart-hlabel" + (r.self ? " is-self" : "") });
      lab.textContent = r.label; lab.setAttribute("fill", r.self ? p.brand : p.dim); svg.appendChild(lab);
      // track
      svg.appendChild(el("rect", { x: trackX, y: cy - 7, width: trackW, height: 14, rx: 7, fill: p.surface2 }));
      const bw = Math.max(3, (r.value / max) * trackW);
      const bar = el("rect", { x: trackX, y: cy - 7, width: bw, height: 14, rx: 7, fill: color, class: "chart-hbar" });
      bar.style.setProperty("--w", bw + "px");
      svg.appendChild(bar);
      const val = el("text", { x: W - 2, y: cy + 4, "text-anchor": "end", class: "chart-hval" + (r.self ? " is-self" : "") });
      val.textContent = vFmt(r.value); val.setAttribute("fill", r.self ? p.brand : p.dim); svg.appendChild(val);
    });
    host.querySelector(".chart-svg")?.remove();
    host.appendChild(svg);
    if (!reduced) svg.classList.add("is-enter-bars");
  };
  return mount(host, draw);
}

/* =================================================================== donut */
export function donut(host, cfg) {
  // cfg: { slices:[{label,value}], centerLabel, centerSub, label }
  host.classList.add("chart", "chart--donut");
  host.setAttribute("role", "img");
  if (cfg.label) host.setAttribute("aria-label", cfg.label);
  const tip = tooltip(host);

  const draw = (W) => {
    const p = palette(host);
    const size = Math.min(W, 216);
    const cx = size / 2, cy = size / 2, R = size / 2 - 6, r = R * 0.62;
    const total = cfg.slices.reduce((a, s) => a + s.value, 0);
    const cols = [p.brand, p.accent, p.up, p.gridStrong, cssvar("--proj", host),
      cssvar("--text-mute", host), cssvar("--down", host), cssvar("--border-strong", host)];
    const svg = el("svg", { viewBox: `0 0 ${size} ${size}`, width: size, height: size, class: "chart-svg" });
    let a0 = -Math.PI / 2;
    cfg.slices.forEach((s, i) => {
      const frac = s.value / total;
      const a1 = a0 + frac * Math.PI * 2;
      const large = a1 - a0 > Math.PI ? 1 : 0;
      const pt = (ang, rad) => [cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad];
      const [x0, y0] = pt(a0, R), [x1, y1] = pt(a1, R), [x2, y2] = pt(a1, r), [x3, y3] = pt(a0, r);
      const d = `M ${x0} ${y0} A ${R} ${R} 0 ${large} 1 ${x1} ${y1} L ${x2} ${y2} A ${r} ${r} 0 ${large} 0 ${x3} ${y3} Z`;
      const color = cols[i % cols.length];
      const seg = el("path", { d, fill: color, stroke: p.surface, "stroke-width": 1.5, class: "chart-seg" });
      seg.addEventListener("pointerenter", () => {
        seg.setAttribute("opacity", 0.82);
        tip.innerHTML = `<span class="chart-tip__row"><i style="background:${color}"></i>${s.label} <b>${Math.round(frac * 100)}%</b></span>`;
        tip.hidden = false;
        tip.style.left = clamp(cx - tip.offsetWidth / 2, 4, host.clientWidth - tip.offsetWidth - 4) + "px";
        tip.style.top = "6px";
      });
      seg.addEventListener("pointerleave", () => { seg.removeAttribute("opacity"); tip.hidden = true; });
      svg.appendChild(seg);
      a0 = a1;
    });
    if (cfg.centerLabel) {
      const t1 = el("text", { x: cx, y: cy - 1, "text-anchor": "middle", class: "chart-donut-c" }); t1.textContent = cfg.centerLabel; t1.setAttribute("fill", p.ink); svg.appendChild(t1);
      if (cfg.centerSub) { const t2 = el("text", { x: cx, y: cy + 15, "text-anchor": "middle", class: "chart-donut-s" }); t2.textContent = cfg.centerSub; t2.setAttribute("fill", p.mute); svg.appendChild(t2); }
    }
    host.querySelector(".chart-svg")?.remove();
    host.insertBefore(svg, tip);
    if (!reduced) svg.classList.add("is-enter");

    // legend, rebuilt alongside
    let lg = host.querySelector(".chart-legend-list");
    if (lg) lg.remove();
    lg = document.createElement("ul"); lg.className = "chart-legend-list";
    cfg.slices.forEach((s, i) => {
      const li = document.createElement("li");
      li.innerHTML = `<span class="sw" style="background:${cols[i % cols.length]}"></span>${s.label}<b>${Math.round((s.value / total) * 100)}%</b>`;
      lg.appendChild(li);
    });
    host.appendChild(lg);
  };
  return mount(host, draw);
}

/* =================================================== valuation sensitivity */
export function sensitivity(host, cfg) {
  // cfg: { pct:[], price:[], current, scenarios:[{pct,name}], priceFormat, label }
  // returns { setPct(value) } so the slider can move the live marker.
  host.classList.add("chart");
  host.setAttribute("role", "img");
  if (cfg.label) host.setAttribute("aria-label", cfg.label);
  const pFmt = cfg.priceFormat || ((v) => "C$" + v.toFixed(2));
  let api = { setPct: () => {} };

  const draw = (W) => {
    const p = palette(host);
    const H = cfg.height || Math.max(200, Math.min(264, Math.round(W * 0.46)));
    const m = { t: 18, r: 16, b: 34, l: 46 };
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    const xs = cfg.pct, ys = (typeof cfg.price === "function") ? cfg.price() : cfg.price;
    const xlo = xs[0], xhi = xs[xs.length - 1];
    let ylo = 0, yhi = Math.max(...ys, cfg.current) * 1.05;
    const tk = ticks(ylo, yhi, 4); ylo = tk[0]; yhi = tk[tk.length - 1];
    const X = (v) => m.l + ((v - xlo) / (xhi - xlo)) * iw;
    const Y = (v) => m.t + ih - ((v - ylo) / (yhi - ylo)) * ih;
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, width: W, height: H, class: "chart-svg" });

    tk.forEach((t) => {
      const y = Y(t);
      svg.appendChild(el("line", { x1: m.l, x2: W - m.r, y1: y, y2: y, stroke: p.grid, "stroke-width": 1, "shape-rendering": "crispEdges", opacity: 0.5 }));
      const tx = el("text", { x: m.l - 8, y: y + 3.5, "text-anchor": "end", class: "chart-axis" }); tx.textContent = "C$" + t.toFixed(2); tx.setAttribute("fill", p.mute); svg.appendChild(tx);
    });
    // x ticks at each scenario pct
    cfg.pct.forEach((pp, i) => {
      if (i % 2 === 0 || i === cfg.pct.length - 1) {
        const tx = el("text", { x: X(pp), y: H - 18, "text-anchor": "middle", class: "chart-axis" }); tx.textContent = Math.round(pp * 100) + "%"; tx.setAttribute("fill", p.mute); svg.appendChild(tx);
      }
    });
    const xlab = el("text", { x: m.l + iw / 2, y: H - 4, "text-anchor": "middle", class: "chart-axis-title" }); xlab.textContent = "% of PEA NAV applied"; xlab.setAttribute("fill", p.mute); svg.appendChild(xlab);

    // current-price reference line
    const yCur = Y(cfg.current);
    svg.appendChild(el("line", { x1: m.l, x2: W - m.r, y1: yCur, y2: yCur, stroke: p.down, "stroke-width": 1.4, "stroke-dasharray": "4 4", opacity: 0.8 }));
    const curT = el("text", { x: W - m.r, y: yCur - 6, "text-anchor": "end", class: "chart-ref" }); curT.textContent = "Today " + pFmt(cfg.current); curT.setAttribute("fill", p.down); svg.appendChild(curT);

    // curve
    const dline = xs.map((xv, i) => (i ? "L" : "M") + X(xv).toFixed(1) + " " + Y(ys[i]).toFixed(1)).join(" ");
    const area = dline + ` L ${X(xhi)} ${Y(ylo)} L ${X(xlo)} ${Y(ylo)} Z`;
    const gid = "sg-" + Math.round(W);
    svg.appendChild(el("defs", {}, [el("linearGradient", { id: gid, x1: 0, y1: 0, x2: 0, y2: 1 }, [
      el("stop", { offset: "0%", "stop-color": p.brandVivid, "stop-opacity": 0.20 }),
      el("stop", { offset: "100%", "stop-color": p.brandVivid, "stop-opacity": 0 }),
    ])]));
    svg.appendChild(el("path", { d: area, fill: `url(#${gid})` }));
    svg.appendChild(el("path", { d: dline, fill: "none", stroke: p.brand, "stroke-width": 2.6, "stroke-linejoin": "round", class: "chart-line" }));

    // scenario dots
    (cfg.scenarios || []).forEach((s) => {
      const yi = interp(xs, ys, s.pct);
      svg.appendChild(el("circle", { cx: X(s.pct), cy: Y(yi), r: 3, fill: p.surface, stroke: p.brand, "stroke-width": 1.6 }));
    });

    // live marker (driven by the slider)
    const mLine = el("line", { y1: m.t, y2: m.t + ih, stroke: p.brand, "stroke-width": 1.4, opacity: 0.5 });
    const mDot = el("circle", { r: 5.5, fill: p.brand, stroke: p.surface, "stroke-width": 2.5 });
    const mLab = el("text", { class: "chart-marker-lab", "text-anchor": "middle" }); mLab.setAttribute("fill", p.brand);
    svg.appendChild(mLine); svg.appendChild(mDot); svg.appendChild(mLab);

    host.querySelector(".chart-svg")?.remove();
    host.insertBefore(svg, host.firstChild);
    if (!reduced) svg.classList.add("is-enter");

    api.setPct = (pct) => {
      pct = clamp(pct, xlo, xhi);
      const yi = interp(xs, ys, pct);
      const x = X(pct), y = Y(yi);
      mLine.setAttribute("x1", x); mLine.setAttribute("x2", x);
      mDot.setAttribute("cx", x); mDot.setAttribute("cy", y);
      mLab.setAttribute("x", clamp(x, m.l + 20, W - m.r - 20)); mLab.setAttribute("y", clamp(y - 12, m.t + 10, H));
      mLab.textContent = pFmt(yi);
    };
    if (cfg._lastPct != null) api.setPct(cfg._lastPct);
  };
  const run = mount(host, draw);
  // expose a stable setter that remembers the last value across redraws
  return {
    setPct: (v) => { cfg._lastPct = v; api.setPct(v); },
    redraw: run,
  };
}

/* ============================================ range bars (football field) */
export function rangeBars(host, cfg) {
  // cfg: { rows:[{label, low, high, mid, upside?}], domainMin, domainMax, ref?, valueFormat, label }
  host.classList.add("chart");
  host.setAttribute("role", "img");
  if (cfg.label) host.setAttribute("aria-label", cfg.label);
  const vFmt = cfg.valueFormat || ((v) => v.toFixed(2));

  const draw = (W) => {
    const p = palette(host);
    const rows = cfg.rows;
    const rowH = 30, gap = 16, padT = 8, padB = 26;
    const H = padT + padB + rows.length * rowH + (rows.length - 1) * gap;
    const labelW = Math.min(150, Math.max(96, Math.round(W * 0.3)));
    const trackX = labelW + 12, trackW = W - trackX - 10;
    const lo = cfg.domainMin, hi = cfg.domainMax;
    const X = (v) => trackX + ((clamp(v, lo, hi) - lo) / (hi - lo)) * trackW;
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, width: W, height: H, class: "chart-svg" });

    // x grid + axis labels
    const tk = ticks(lo, hi, 4);
    tk.forEach((t) => {
      if (t < lo || t > hi) return;
      svg.appendChild(el("line", { x1: X(t), x2: X(t), y1: padT, y2: H - padB, stroke: p.grid, "stroke-width": 1, "shape-rendering": "crispEdges", opacity: 0.5 }));
      const tx = el("text", { x: X(t), y: H - padB + 16, "text-anchor": "middle", class: "chart-axis" }); tx.textContent = vFmt(t); tx.setAttribute("fill", p.mute); svg.appendChild(tx);
    });
    // reference line (e.g., current price)
    if (cfg.ref != null) {
      svg.appendChild(el("line", { x1: X(cfg.ref), x2: X(cfg.ref), y1: padT - 2, y2: H - padB, stroke: p.down, "stroke-width": 1.4, "stroke-dasharray": "4 4", opacity: 0.85 }));
    }

    rows.forEach((r, i) => {
      const y = padT + i * (rowH + gap), cy = y + rowH / 2;
      const color = r.upside ? p.up : p.brand;
      const lab = el("text", { x: labelW, y: cy - 1, "text-anchor": "end", class: "chart-hlabel" }); lab.textContent = r.label; lab.setAttribute("fill", p.dim); svg.appendChild(lab);
      // range bar
      const x0 = X(r.low), x1 = X(r.high);
      svg.appendChild(el("rect", { x: x0, y: cy - 8, width: Math.max(2, x1 - x0), height: 16, rx: 4, fill: color, opacity: r.upside ? 0.35 : 0.22, class: "chart-hbar" }));
      svg.appendChild(el("rect", { x: x0, y: cy - 8, width: Math.max(2, x1 - x0), height: 16, rx: 4, fill: "none", stroke: color, "stroke-width": 1.2, opacity: 0.7 }));
      // mid marker
      if (r.mid != null) svg.appendChild(el("line", { x1: X(r.mid), x2: X(r.mid), y1: cy - 9, y2: cy + 9, stroke: color, "stroke-width": 2.4 }));
      // value labels at ends
      const lo2 = el("text", { x: x0 - 5, y: cy + 11, "text-anchor": "end", class: "chart-rangeval" }); lo2.textContent = vFmt(r.low); lo2.setAttribute("fill", p.mute);
      const hi2 = el("text", { x: x1 + 5, y: cy + 11, "text-anchor": "start", class: "chart-rangeval" }); hi2.textContent = vFmt(r.high); hi2.setAttribute("fill", p.mute);
      svg.appendChild(lo2); svg.appendChild(hi2);
    });
    host.querySelector(".chart-svg")?.remove();
    host.appendChild(svg);
    if (!reduced) svg.classList.add("is-enter-bars");
  };
  return mount(host, draw);
}

/* linear interpolation of y at x over sorted xs[] */
function interp(xs, ys, x) {
  if (x <= xs[0]) return ys[0];
  if (x >= xs[xs.length - 1]) return ys[ys.length - 1];
  for (let i = 1; i < xs.length; i++) {
    if (x <= xs[i]) { const t = (x - xs[i - 1]) / (xs[i] - xs[i - 1]); return lerp(ys[i - 1], ys[i], t); }
  }
  return ys[ys.length - 1];
}

export { short };
