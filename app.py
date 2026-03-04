"""
First Phosphate Corp (CSE: PHOS) — Financial Analysis
Full-screen Excel experience via Luckysheet. Dashboard toggle available.
"""

import streamlit as st
import streamlit.components.v1 as components
import base64
import plotly.graph_objects as go
from plotly.subplots import make_subplots

st.set_page_config(
    page_title="PHOS Financial Analysis",
    page_icon="⛏",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Hide Streamlit chrome for full-screen feel
st.markdown("""
<style>
    #MainMenu, header, footer, .stDeployButton { display: none !important; }
    .block-container { padding: 0 !important; max-width: 100% !important; }
    .stApp > header { display: none !important; }
    div[data-testid="stToolbar"] { display: none !important; }
    section[data-testid="stSidebar"] { display: none !important; }
    .element-container { margin: 0 !important; padding: 0 !important; }
    iframe { border: none !important; }
    
    /* Floating toggle */
    .float-toggle {
        position: fixed; top: 8px; right: 12px; z-index: 99999;
        background: rgba(14,17,23,0.9); border: 1px solid #333;
        border-radius: 6px; padding: 6px 12px; backdrop-filter: blur(8px);
        display: flex; align-items: center; gap: 8px;
    }
    .float-toggle .brand { font-size: 12px; font-weight: 700; color: #e94560; }
    
    /* Dashboard mode */
    .dash-container { padding: 16px 24px; }
    .metric-row { display: flex; gap: 8px; margin: 12px 0; flex-wrap: wrap; }
    .metric-card {
        flex: 1 1 calc(20% - 8px); min-width: 120px; background: #1a1a2e;
        border: 1px solid #0f3460; border-radius: 8px; padding: 12px;
    }
    .metric-card .label { font-size: 11px; color: #888; }
    .metric-card .value { font-size: 18px; font-weight: 700; color: #e94560; }
    .metric-card .delta { font-size: 10px; color: #888; }
    @media (max-width: 768px) {
        .metric-card { flex: 1 1 calc(50% - 6px); }
        .dash-container { padding: 12px; }
    }
    @media (max-width: 480px) { .metric-card { flex: 1 1 100%; } }
</style>
""", unsafe_allow_html=True)


def get_xlsx_base64():
    with open("data.xlsx", "rb") as f:
        return base64.b64encode(f.read()).decode()


def render_fullscreen_excel():
    xlsx_b64 = get_xlsx_base64()
    html = f"""<!DOCTYPE html><html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/luckysheet@2.1.13/dist/plugins/css/pluginsCss.css"/>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/luckysheet@2.1.13/dist/plugins/plugins.css"/>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/luckysheet@2.1.13/dist/css/luckysheet.css"/>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/luckysheet@2.1.13/dist/assets/iconfont/iconfont.css"/>
<script src="https://cdn.jsdelivr.net/npm/luckysheet@2.1.13/dist/plugins/js/plugin.js"></script>
<script src="https://cdn.jsdelivr.net/npm/luckysheet@2.1.13/dist/luckysheet.umd.js"></script>
<script src="https://cdn.jsdelivr.net/npm/luckyexcel@1.0.1/dist/luckyexcel.umd.js"></script>
<style>
*{{margin:0;padding:0;box-sizing:border-box}}
html,body{{height:100%;width:100%;overflow:hidden;background:#0e1117;touch-action:manipulation}}
#luckysheet{{position:absolute;top:0;left:0;right:0;bottom:0;width:100%;height:100%}}

/* Dark theme */
.luckysheet-wa-editor,.luckysheet-grid-window{{background:#0e1117!important}}
.luckysheet-cell-input{{background:#1a1a2e!important;color:#fff!important}}
.luckysheet-sheets-item{{background:#1a1a2e!important;color:#ccc!important;border-color:#333!important}}
.luckysheet-sheets-item-active{{background:#0f3460!important;color:#fff!important}}
.luckysheet-sheet-area,.luckysheet-sheet-container{{background:#0e1117!important;border-color:#333!important}}
.luckysheet-toolbar{{background:#0e1117!important;border-color:#333!important}}
.luckysheet-toolbar-button{{color:#ccc!important}}
.luckysheet-cols-h-cells,.luckysheet-rows-h{{background:#16213e!important;color:#888!important}}
.luckysheet-scrollbar-x,.luckysheet-scrollbar-y{{background:#1a1a2e!important}}
.luckysheet-stat-area{{background:#0e1117!important;color:#888!important;border-color:#333!important}}
.luckysheet-input-box{{background:#1a1a2e!important;color:#fff!important;border-color:#333!important}}
.luckysheet-wa-functionbox{{background:#0e1117!important;border-color:#333!important}}
.luckysheet-name-box{{background:#1a1a2e!important;color:#fff!important;border-color:#333!important}}
.luckysheet-toolbar-menu-line{{border-color:#333!important}}
.luckysheet-cell-selected{{border-color:#e94560!important}}
.luckysheet-column-selected,.luckysheet-row-selected{{background:rgba(233,69,96,0.1)!important}}
.luckysheet-wa-functionbox-cancel,.luckysheet-wa-functionbox-confirm{{background:#1a1a2e!important;color:#ccc!important}}
.luckysheet-cols-menu,.luckysheet-rightclick-menu{{background:#1a1a2e!important;border-color:#333!important;color:#ccc!important}}
.luckysheet-cols-menuitem:hover,.luckysheet-rightclick-menu-item:hover{{background:#0f3460!important}}
.luckysheet-modal-dialog{{background:#1a1a2e!important;border-color:#333!important;color:#ccc!important}}
.luckysheet-modal-dialog-title-text{{color:#fff!important}}

/* Mobile touch */
@media(max-width:768px){{
    .luckysheet-toolbar{{overflow-x:auto!important;white-space:nowrap!important;-webkit-overflow-scrolling:touch}}
    .luckysheet-toolbar-button{{padding:2px 3px!important;min-width:24px!important}}
    .luckysheet-name-box{{width:50px!important;font-size:11px!important}}
    .luckysheet-wa-functionbox{{font-size:12px!important}}
    .luckysheet-sheets-item{{padding:4px 8px!important;font-size:11px!important}}
}}
</style>
</head><body>
<div id="luckysheet"></div>
<script>
var b64="{xlsx_b64}";
var bin=atob(b64);var u8=new Uint8Array(bin.length);
for(var i=0;i<bin.length;i++)u8[i]=bin.charCodeAt(i);
var blob=new Blob([u8],{{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}});

LuckyExcel.transformExcelToLucky(blob,function(ej){{
    if(!ej||!ej.sheets||!ej.sheets.length){{
        document.getElementById('luckysheet').innerHTML='<p style="color:#e94560;padding:20px;font-family:sans-serif">Failed to load spreadsheet. Try refreshing.</p>';
        return;
    }}
    ej.sheets[0].status=1;
    for(var i=1;i<ej.sheets.length;i++)ej.sheets[i].status=0;
    
    window.luckysheet.create({{
        container:'luckysheet',
        data:ej.sheets,
        title:'',
        showtoolbar:true,
        showinfobar:false,
        showsheetbar:true,
        showstatisticBar:true,
        sheetBottomConfig:true,
        allowEdit:true,
        enableAddRow:true,
        enableAddBackTop:false,
        showConfigWindowResize:false,
        forceCalculation:true,
        defaultFontSize:11,
        gridKey:'phos',
        loadUrl:'',
        plugins:['chart'],
    }});
    
    // Resize handler
    window.addEventListener('resize',function(){{
        try{{window.luckysheet.resize()}}catch(e){{}}
    }});
}});
</script></body></html>"""
    
    # Use JavaScript to get viewport height for truly full-screen
    components.html(html, height=900, scrolling=False)


# ============================================================
# DASHBOARD
# ============================================================
def render_dashboard():
    st.markdown('<div class="dash-container">', unsafe_allow_html=True)
    
    selected = st.radio("", [
        "Overview", "Financials", "Cash Burn", "Peers", "Valuation", "Risk", "Management"
    ], horizontal=True, label_visibility="collapsed")
    
    if selected == "Overview":
        st.markdown("""<div class="metric-row">
            <div class="metric-card"><div class="label">Price</div><div class="value">C$1.05</div><div class="delta">+193% 1yr</div></div>
            <div class="metric-card"><div class="label">Mkt Cap</div><div class="value">~C$158M</div></div>
            <div class="metric-card"><div class="label">Cash</div><div class="value">C$20M</div></div>
            <div class="metric-card"><div class="label">NPV(8%)</div><div class="value">C$1.59B</div></div>
            <div class="metric-card"><div class="label">Cap/NPV</div><div class="value">~11%</div></div>
        </div>""", unsafe_allow_html=True)
        l, r = st.columns(2)
        with l:
            q = ["Q4'24","Q1'25","Q2'25","Q3'25","Q4'25","Q1'26","Q2'26","Q3'26"]
            c = [7.5,1.7,0.4,0.1,1.9,3.2,7.6,20.0]
            fig = go.Figure(go.Bar(x=q,y=c,marker_color=['#e94560' if v<1 else '#0f3460' for v in c],
                text=[f"${v:.1f}M" for v in c],textposition='outside'))
            fig.update_layout(title="Cash (C$M)",template="plotly_dark",height=320,margin=dict(t=35,b=25),yaxis=dict(gridcolor='#222'))
            st.plotly_chart(fig,use_container_width=True)
        with r:
            s = [73.8,74.9,76.1,77.2,89.9,97.0,123.5,151.2]
            fig = go.Figure(go.Scatter(x=q,y=s,mode='lines+markers',line=dict(color='#e94560',width=3),
                text=[f"{v:.0f}M" for v in s],textposition='top center'))
            fig.update_layout(title="Shares (M)",template="plotly_dark",height=320,margin=dict(t=35,b=25),yaxis=dict(gridcolor='#222'))
            st.plotly_chart(fig,use_container_width=True)
        c1,c2,c3 = st.columns(3)
        with c1: st.success("**Bull C$1.84** — FS + OEM + LFP boom")
        with c2: st.info("**Base C$1.01** — Current 11% NPV")
        with c3: st.error("**Bear C$0.28** — Resource fail, 3% NPV")
    
    elif selected == "Financials":
        p = ["FY24","FY25","Q1'26","Q2'26","Q3'26"]
        fig = make_subplots(specs=[[{"secondary_y":True}]])
        fig.add_trace(go.Bar(name="Assets",x=p,y=[13.0,7.5,8.7,14.7,25.1],marker_color='#0f3460'))
        fig.add_trace(go.Bar(name="Liabilities",x=p,y=[3.7,1.1,0.8,0.8,1.2],marker_color='#e94560'))
        fig.add_trace(go.Scatter(name="Equity",x=p,y=[9.3,6.4,7.9,13.9,23.9],
            mode='lines+markers',line=dict(color='#53d769',width=3)),secondary_y=True)
        fig.update_layout(title="Balance Sheet (C$M)",template="plotly_dark",height=400,barmode='group',
            margin=dict(t=40,b=30),legend=dict(orientation="h",y=1.12))
        fig.update_yaxes(gridcolor='#222')
        st.plotly_chart(fig,use_container_width=True)
    
    elif selected == "Cash Burn":
        st.markdown("""<div class="metric-row">
            <div class="metric-card"><div class="label">Qtr Burn</div><div class="value">~C$2.7M</div></div>
            <div class="metric-card"><div class="label">Cash</div><div class="value">~C$33M</div></div>
            <div class="metric-card"><div class="label">Runway</div><div class="value">~30mo</div></div>
        </div>""", unsafe_allow_html=True)
        st.warning("Capex Gap: C$675M+ needed vs C$33M cash")
    
    elif selected == "Peers":
        fig = go.Figure(go.Bar(x=["PHOS","DAN","NMG","PMET"],y=[11,1.5,34,37],
            marker_color=['#e94560','#0f3460','#53d769','#ff8a5c'],
            text=["11%","1.5%","34%","37%"],textposition='outside',textfont=dict(size=16)))
        fig.update_layout(title="Mkt Cap / NPV",template="plotly_dark",height=380,margin=dict(t=40,b=30),yaxis=dict(gridcolor='#222'))
        st.plotly_chart(fig,use_container_width=True)
    
    elif selected == "Valuation":
        npv=1.59e9
        pct=st.slider("NPV %",3,30,11)
        price=(npv*pct/100)/192.4e6
        c1,c2=st.columns(2)
        c1.metric("Price (FD)",f"C${price:.2f}",f"{(price/1.05-1)*100:+.0f}%")
        c2.metric("NAV",f"C${npv*pct/100/1e6:.0f}M")
    
    elif selected == "Risk":
        for c in ["PFS/FS (2026-27)","OEM Offtake","C$4.9M NRCan Grant","30,000m Drill","ADR Listing"]:
            st.markdown(f"- {c}")
        st.error("Key: C$675M capex gap. 83% Inferred resource.")
    
    elif selected == "Management":
        st.markdown("""<div class="metric-row">
            <div class="metric-card"><div class="label">CEO Buying</div><div class="value">C$1.8M</div></div>
            <div class="metric-card"><div class="label">CEO Salary</div><div class="value">$0</div></div>
            <div class="metric-card"><div class="label">Board Fees</div><div class="value">$0</div></div>
            <div class="metric-card"><div class="label">Rating</div><div class="value" style="color:#53d769">Above Avg</div></div>
        </div>""", unsafe_allow_html=True)
        cats=["Lead","Board","Tech","Strategy","Comp","Insider","Ops"]
        r=[4,3,5,5,5,5,3]
        fig=go.Figure(go.Bar(x=cats,y=r,marker_color=['#53d769' if v>=4 else '#ff8a5c' for v in r],
            text=[f"{'★'*v}" for v in r],textposition='outside'))
        fig.update_layout(template="plotly_dark",height=340,margin=dict(t=30,b=30),yaxis=dict(range=[0,5.5],gridcolor='#222'))
        st.plotly_chart(fig,use_container_width=True)
    
    st.markdown('</div>', unsafe_allow_html=True)


# ============================================================
# MAIN — Toggle between full-screen Excel and Dashboard
# ============================================================

view = st.query_params.get("view", "excel")

# Minimal floating header
col1, col2, col3 = st.columns([3, 1, 1])
with col1:
    st.markdown('<span style="font-size:14px;font-weight:700;color:#e94560">PHOS</span> <span style="font-size:12px;color:#888">First Phosphate Corp.</span>', unsafe_allow_html=True)
with col3:
    dashboard_mode = st.toggle("Dashboard", value=(view == "dashboard"))

if dashboard_mode:
    render_dashboard()
else:
    render_fullscreen_excel()
