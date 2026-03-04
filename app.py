"""
First Phosphate Corp (CSE: PHOS) — Financial Analysis Dashboard
Excel-like spreadsheet (default) + Dashboard toggle.
Uses Luckysheet for full Excel experience with editable cells & formulas.
"""

import streamlit as st
import streamlit.components.v1 as components
import base64
import json
import openpyxl
from openpyxl.utils import get_column_letter
import plotly.graph_objects as go
from plotly.subplots import make_subplots

st.set_page_config(
    page_title="PHOS Financial Analysis",
    page_icon="⛏",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# --- CSS (mobile-optimized) ---
st.markdown("""
<style>
    .block-container { padding-top: 0.5rem; padding-bottom: 0; max-width: 100%; padding-left: 1rem; padding-right: 1rem; }
    .main-header {
        display: flex; align-items: center; justify-content: space-between;
        padding: 8px 0; border-bottom: 1px solid #333; margin-bottom: 4px;
    }
    .main-header h1 { margin: 0; font-size: 20px; font-weight: 700; }
    .main-header .subtitle { color: #888; font-size: 12px; margin-top: 2px; }
    .metric-row { display: flex; gap: 8px; margin: 12px 0; flex-wrap: wrap; }
    .metric-card {
        flex: 1 1 calc(50% - 8px); min-width: 120px; background: #1a1a2e;
        border: 1px solid #0f3460; border-radius: 8px; padding: 12px;
    }
    .metric-card .label { font-size: 11px; color: #888; margin-bottom: 2px; }
    .metric-card .value { font-size: 18px; font-weight: 700; color: #e94560; }
    .metric-card .delta { font-size: 11px; color: #888; margin-top: 2px; }
    iframe { border: none !important; }
    
    /* Mobile overrides */
    @media (max-width: 768px) {
        .block-container { padding-left: 0.5rem; padding-right: 0.5rem; }
        .main-header h1 { font-size: 16px; }
        .main-header .subtitle { font-size: 10px; }
        .metric-card { flex: 1 1 calc(50% - 6px); min-width: 100px; padding: 10px; }
        .metric-card .value { font-size: 16px; }
        .metric-card .label, .metric-card .delta { font-size: 10px; }
        /* Horizontal scroll for radio tabs */
        div[data-testid="stHorizontalBlock"] { overflow-x: auto; flex-wrap: nowrap !important; }
        div[role="radiogroup"] { flex-wrap: nowrap !important; overflow-x: auto; gap: 0 !important; }
        div[role="radiogroup"] label { font-size: 11px !important; padding: 4px 8px !important; white-space: nowrap; }
        /* Plotly charts responsive */
        .js-plotly-plot { width: 100% !important; }
    }
    @media (max-width: 480px) {
        .main-header h1 { font-size: 14px; }
        .metric-card { flex: 1 1 100%; }
        .metric-card .value { font-size: 20px; }
    }
</style>
""", unsafe_allow_html=True)


# ============================================================
# EXCEL VIEW — Luckysheet
# ============================================================

def get_xlsx_base64():
    with open("data.xlsx", "rb") as f:
        return base64.b64encode(f.read()).decode()


def render_luckysheet(sheet_index=0):
    """Render full Luckysheet spreadsheet from xlsx."""
    xlsx_b64 = get_xlsx_base64()
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/luckysheet@2.1.13/dist/plugins/css/pluginsCss.css"/>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/luckysheet@2.1.13/dist/plugins/plugins.css"/>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/luckysheet@2.1.13/dist/css/luckysheet.css"/>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/luckysheet@2.1.13/dist/assets/iconfont/iconfont.css"/>
        <script src="https://cdn.jsdelivr.net/npm/luckysheet@2.1.13/dist/plugins/js/plugin.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/luckysheet@2.1.13/dist/luckysheet.umd.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/luckyexcel@1.0.1/dist/luckyexcel.umd.js"></script>
        <style>
            * {{ margin: 0; padding: 0; box-sizing: border-box; }}
            html, body {{ height: 100%; overflow: hidden; background: #1a1a2e; }}
            #luckysheet {{ width: 100%; height: 100%; }}
            /* Responsive */
            @media (max-width: 768px) {{
                .luckysheet-toolbar {{ font-size: 11px !important; overflow-x: auto !important; }}
                .luckysheet-toolbar-button {{ padding: 2px 4px !important; }}
                .luckysheet-wa-functionbox {{ font-size: 12px !important; }}
                .luckysheet-name-box {{ width: 60px !important; font-size: 11px !important; }}
            }}
            /* Dark theme overrides */
            .luckysheet-wa-editor {{ background: #0e1117 !important; }}
            .luckysheet-grid-window {{ background: #0e1117 !important; }}
            .luckysheet-cell-input {{ background: #1a1a2e !important; color: #fff !important; }}
            .luckysheet-sheets-item {{ background: #1a1a2e !important; color: #ccc !important; border-color: #333 !important; }}
            .luckysheet-sheets-item-active {{ background: #0f3460 !important; color: #fff !important; }}
            .luckysheet-sheet-area {{ background: #0e1117 !important; border-color: #333 !important; }}
            .luckysheet-sheet-container {{ background: #0e1117 !important; }}
            .luckysheet-toolbar {{ background: #0e1117 !important; border-color: #333 !important; }}
            .luckysheet-toolbar-button {{ color: #ccc !important; }}
            .luckysheet-cols-h-cells, .luckysheet-rows-h {{ background: #16213e !important; color: #888 !important; }}
            .luckysheet-scrollbar-x, .luckysheet-scrollbar-y {{ background: #1a1a2e !important; }}
            .luckysheet-stat-area {{ background: #0e1117 !important; color: #888 !important; border-color: #333 !important; }}
            .luckysheet-input-box {{ background: #1a1a2e !important; color: #fff !important; border-color: #333 !important; }}
            .luckysheet-wa-functionbox {{ background: #0e1117 !important; border-color: #333 !important; }}
            .luckysheet-wa-functionbox-cancel, .luckysheet-wa-functionbox-confirm {{ background: #1a1a2e !important; }}
            .luckysheet-name-box {{ background: #1a1a2e !important; color: #fff !important; border-color: #333 !important; }}
            .luckysheet-toolbar-menu-line {{ border-color: #333 !important; }}
        </style>
    </head>
    <body>
        <div id="luckysheet"></div>
        <script>
            // Decode xlsx from base64
            var b64 = "{xlsx_b64}";
            var binary = atob(b64);
            var bytes = new Uint8Array(binary.length);
            for (var i = 0; i < binary.length; i++) {{
                bytes[i] = binary.charCodeAt(i);
            }}
            var blob = new Blob([bytes], {{type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}});
            
            // Parse with LuckyExcel and render
            LuckyExcel.transformExcelToLucky(blob, function(exportJson) {{
                if (!exportJson || !exportJson.sheets || exportJson.sheets.length === 0) {{
                    document.getElementById('luckysheet').innerHTML = '<p style="color:#e94560;padding:20px">Failed to load spreadsheet</p>';
                    return;
                }}
                
                // Set active sheet
                exportJson.sheets.forEach(function(sheet, idx) {{
                    sheet.status = idx === {sheet_index} ? 1 : 0;
                }});
                
                window.luckysheet.create({{
                    container: 'luckysheet',
                    data: exportJson.sheets,
                    title: '',
                    showtoolbar: true,
                    showinfobar: false,
                    showsheetbar: true,
                    showstatisticBar: true,
                    sheetBottomConfig: true,
                    allowEdit: true,
                    enableAddRow: true,
                    enableAddBackTop: false,
                    showConfigWindowResize: false,
                    forceCalculation: true,
                    defaultFontSize: 11,
                    column: 10,
                    row: 60,
                    gridKey: 'phos',
                    loadUrl: '',
                    plugins: ['chart'],
                }});
            }});
        </script>
    </body>
    </html>
    """
    components.html(html, height=700, scrolling=True)


# ============================================================
# DASHBOARD RENDERERS
# ============================================================

def dashboard_overview():
    st.markdown("""
    <div class="metric-row">
        <div class="metric-card"><div class="label">Share Price</div><div class="value">C$1.05</div><div class="delta">+193% 1yr</div></div>
        <div class="metric-card"><div class="label">Market Cap</div><div class="value">~C$158M</div><div class="delta">FD ~C$202M</div></div>
        <div class="metric-card"><div class="label">Cash (Q3)</div><div class="value">C$20.0M</div><div class="delta">Post-raise</div></div>
        <div class="metric-card"><div class="label">PEA NPV (8%)</div><div class="value">C$1.59B</div><div class="delta">After-tax</div></div>
        <div class="metric-card"><div class="label">Mkt Cap / NPV</div><div class="value">~11%</div><div class="delta">LFP premium</div></div>
    </div>
    """, unsafe_allow_html=True)
    left, right = st.columns(2)
    with left:
        quarters = ["Q4'24", "Q1'25", "Q2'25", "Q3'25", "Q4'25", "Q1'26", "Q2'26", "Q3'26"]
        cash = [7496238, 1651673, 410444, 149983, 1873550, 3173855, 7590632, 19983238]
        fig = go.Figure(go.Bar(x=quarters, y=[c/1e6 for c in cash],
            marker_color=['#e94560' if c < 1e6 else '#0f3460' for c in cash],
            text=[f"${c/1e6:.1f}M" for c in cash], textposition='outside'))
        fig.update_layout(title="Cash Position", yaxis_title="C$ Millions",
            template="plotly_dark", height=340, margin=dict(t=40, b=30), yaxis=dict(gridcolor='#222'))
        st.plotly_chart(fig, use_container_width=True)
    with right:
        shares = [73786772, 74867570, 76103368, 77198802, 89947551, 97023899, 123546512, 151220000]
        fig = go.Figure(go.Scatter(x=quarters, y=[s/1e6 for s in shares],
            mode='lines+markers+text', line=dict(color='#e94560', width=3), marker=dict(size=8),
            text=[f"{s/1e6:.0f}M" for s in shares], textposition='top center'))
        fig.update_layout(title="Share Dilution", yaxis_title="Shares (M)",
            template="plotly_dark", height=340, margin=dict(t=40, b=30), yaxis=dict(gridcolor='#222'))
        st.plotly_chart(fig, use_container_width=True)
    c1, c2, c3 = st.columns(3)
    with c1: st.success("**Bull — C$1.84/sh**\nFS confirms PEA. OEM partnership. 20% NPV.")
    with c2: st.info("**Base — C$1.01/sh**\nCurrent pricing ~11% NPV. Drill on schedule.")
    with c3: st.error("**Bear — C$0.28/sh**\nResource downgrade. Capex failure. 3% NPV.")

def dashboard_financial():
    periods = ["FY2024", "FY2025", "Q1 FY26", "Q2 FY26", "Q3 FY26"]
    assets = [12995758, 7452772, 8735500, 14682667, 25126133]
    liabs = [3684258, 1063172, 809820, 758567, 1235763]
    equity = [9311500, 6389600, 7925680, 13924100, 23890370]
    fig = make_subplots(specs=[[{"secondary_y": True}]])
    fig.add_trace(go.Bar(name="Assets", x=periods, y=[a/1e6 for a in assets], marker_color='#0f3460'))
    fig.add_trace(go.Bar(name="Liabilities", x=periods, y=[l/1e6 for l in liabs], marker_color='#e94560'))
    fig.add_trace(go.Scatter(name="Equity", x=periods, y=[e/1e6 for e in equity],
        mode='lines+markers', line=dict(color='#53d769', width=3)), secondary_y=True)
    fig.update_layout(title="Balance Sheet", template="plotly_dark", height=380,
        barmode='group', margin=dict(t=40, b=30), legend=dict(orientation="h", y=1.12))
    fig.update_yaxes(title_text="C$M", secondary_y=False, gridcolor='#222')
    fig.update_yaxes(title_text="Equity", secondary_y=True, gridcolor='#222')
    st.plotly_chart(fig, use_container_width=True)

def dashboard_cashburn():
    st.markdown("""<div class="metric-row">
        <div class="metric-card"><div class="label">Quarterly Burn</div><div class="value">~C$2.7M</div></div>
        <div class="metric-card"><div class="label">Est. Cash</div><div class="value">~C$32.6M</div></div>
        <div class="metric-card"><div class="label">Runway</div><div class="value">~30 mo</div></div>
    </div>""", unsafe_allow_html=True)
    quarters = ["Q4'24", "Q1'25", "Q2'25", "Q3'25", "Q4'25", "Q1'26", "Q2'26"]
    burn = [3764747, 4185217, 170997, 1681986, 1589214, 1748338, 2006009]
    cum_dil = [1.5, 3.1, 4.6, 21.9, 31.5, 67.4, 104.9]
    left, right = st.columns(2)
    with left:
        fig = go.Figure(go.Bar(x=quarters, y=[b/1e6 for b in burn], marker_color='#e94560',
            text=[f"${b/1e6:.1f}M" for b in burn], textposition='outside'))
        fig.update_layout(title="Net Loss", template="plotly_dark", height=320, margin=dict(t=40,b=30), yaxis=dict(gridcolor='#222'))
        st.plotly_chart(fig, use_container_width=True)
    with right:
        fig = go.Figure(go.Scatter(x=quarters, y=cum_dil, mode='lines+markers+text',
            fill='tozeroy', line=dict(color='#e94560', width=3),
            text=[f"{d:.0f}%" for d in cum_dil], textposition='top center', fillcolor='rgba(233,69,96,0.15)'))
        fig.update_layout(title="Cumulative Dilution", template="plotly_dark", height=320, margin=dict(t=40,b=30), yaxis=dict(gridcolor='#222'))
        st.plotly_chart(fig, use_container_width=True)

def dashboard_peers():
    companies = ["PHOS", "DAN", "NMG", "PMET"]
    npv_pct = [11, 1.5, 34, 37]
    fig = go.Figure(go.Bar(x=companies, y=npv_pct, marker_color=['#e94560','#0f3460','#53d769','#ff8a5c'],
        text=[f"{p}%" for p in npv_pct], textposition='outside', textfont=dict(size=16)))
    fig.update_layout(title="Market Cap / NPV — LFP Supply Chain", template="plotly_dark", height=380,
        margin=dict(t=40,b=30), yaxis=dict(gridcolor='#222'))
    st.plotly_chart(fig, use_container_width=True)

def dashboard_valuation():
    npv = 1_590_000_000
    pct = st.slider("NAV Discount %", 3, 30, 11, 1)
    price = (npv * pct / 100) / 192_400_000
    c1, c2, c3 = st.columns(3)
    c1.metric("Implied NAV", f"C${npv*pct/100/1e6:.0f}M")
    c2.metric("Price (FD)", f"C${price:.2f}", f"{'+'if price>1.05 else ''}{(price/1.05-1)*100:.0f}% vs C$1.05")
    c3.metric("Assessment", "Very Cheap" if pct<=3 else "Cheap" if pct<=5 else "Fair" if pct<=7 else "~Current" if pct<=12 else "Rich")
    fig = go.Figure(go.Bar(x=["Bear","Base","Bull"], y=[0.28,1.01,1.84],
        marker_color=['#e94560','#0f3460','#53d769'],
        text=["C$0.28","C$1.01","C$1.84"], textposition='outside', textfont=dict(size=18)))
    fig.add_hline(y=1.05, line_dash="dash", line_color="white", annotation_text="Current")
    fig.update_layout(template="plotly_dark", height=320, margin=dict(t=30,b=30), yaxis=dict(gridcolor='#222'))
    st.plotly_chart(fig, use_container_width=True)

def dashboard_risk():
    catalysts = ["PFS/FS Completion (2026-2027)", "OEM Partnership / Offtake",
        "Federal Critical Minerals Grant C$4.9M", "30,000m Drill Program", "ADR Listing"]
    for c in catalysts: st.markdown(f"- {c}")
    st.warning("Key Risk: C$675M+ capex gap unfunded. Extreme dilution risk.")

def dashboard_mgmt():
    st.markdown("""<div class="metric-row">
        <div class="metric-card"><div class="label">CEO Buying</div><div class="value">C$1.8M</div><div class="delta">Open market</div></div>
        <div class="metric-card"><div class="label">CEO Salary</div><div class="value">$0 Cash</div><div class="delta">100% equity</div></div>
        <div class="metric-card"><div class="label">Board Fees</div><div class="value">$0 Cash</div><div class="delta">100% RSUs</div></div>
        <div class="metric-card"><div class="label">Rating</div><div class="value" style="color:#53d769">Above Avg</div></div>
    </div>""", unsafe_allow_html=True)
    cats = ["Leadership", "Independence", "Technical", "Strategic", "Comp Alignment", "Insider", "Ops Ready"]
    ratings = [4, 3, 5, 5, 5, 5, 3]
    fig = go.Figure(go.Bar(x=cats, y=ratings,
        marker_color=['#53d769' if r>=4 else '#ff8a5c' for r in ratings],
        text=[f"{'★'*r}" for r in ratings], textposition='outside'))
    fig.update_layout(title="Management Ratings", template="plotly_dark", height=350,
        margin=dict(t=40,b=30), yaxis=dict(range=[0,5.5], dtick=1, gridcolor='#222'))
    st.plotly_chart(fig, use_container_width=True)

DASHBOARDS = {
    "Company Overview": dashboard_overview,
    "Financial Statements": dashboard_financial,
    "Cash Burn Analysis": dashboard_cashburn,
    "Peer Analysis": dashboard_peers,
    "Valuation Model": dashboard_valuation,
    "Analysis & Summary": dashboard_risk,
    "Management & Governance": dashboard_mgmt,
}

SHEET_NAMES = [
    "Company Overview", "Financial Statements", "Cash Burn Analysis",
    "Peer Analysis", "Valuation Model", "Analysis & Summary",
    "Management & Governance", "Claude Log"
]

# Map display names to actual xlsx sheet names
SHEET_MAP = {
    "Company Overview": "Company Overview",
    "Financial Statements": "Financial Statements",
    "Cash Burn Analysis": "Cash Burn Analysis",
    "Peer Analysis": "Peer Analysis",
    "Valuation Model": "Valuation Model",
    "Analysis & Summary": "Analysis & Summary",
    "Management & Governance": "Management & Governance",
    "Claude Log": "Claude Log",
}

# ============================================================
# MAIN
# ============================================================

# Header
h1, h2 = st.columns([5, 1])
with h1:
    st.markdown("""<div class="main-header"><div>
        <h1>First Phosphate Corp.</h1>
        <div class="subtitle">CSE: PHOS | OTCQX: FRSPF | Pre-Revenue LFP Battery Phosphate Developer</div>
    </div></div>""", unsafe_allow_html=True)
with h2:
    st.markdown("<div style='padding-top:8px'></div>", unsafe_allow_html=True)
    view_mode = st.toggle("Dashboard", value=False)

if view_mode:
    # Dashboard mode — tabs + charts
    selected = st.radio("", SHEET_NAMES, horizontal=True, label_visibility="collapsed")
    st.markdown("---")
    if selected in DASHBOARDS:
        DASHBOARDS[selected]()
    else:
        st.info("Dashboard view not available for this sheet. Toggle off to view in spreadsheet.")
else:
    # Excel mode — full Luckysheet
    render_luckysheet(sheet_index=0)

st.markdown("<div style='font-size:11px;color:#555;text-align:center;padding:4px'>Built by Samuel Jo | Data: SEDAR+ | Not investment advice</div>", unsafe_allow_html=True)
