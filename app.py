"""
First Phosphate Corp (CSE: PHOS) — Financial Analysis
Pure full-screen Excel experience via Luckysheet.
"""

import streamlit as st
import streamlit.components.v1 as components
import base64

st.set_page_config(
    page_title="PHOS Financial Analysis",
    page_icon="⛏",
    layout="wide",
    initial_sidebar_state="collapsed"
)

st.markdown("""
<style>
    #MainMenu, header, footer, .stDeployButton,
    div[data-testid="stToolbar"], div[data-testid="stDecoration"],
    div[data-testid="stStatusWidget"], section[data-testid="stSidebar"],
    .stApp > header { display: none !important; }
    .block-container { padding: 0 !important; max-width: 100% !important; margin: 0 !important; }
    .stApp { overflow: hidden !important; background: #fff !important; height: 100vh !important; }
    html, body { overflow: hidden !important; height: 100vh !important; margin: 0 !important; padding: 0 !important; }
    .element-container { margin: 0 !important; padding: 0 !important; }
    iframe { border: none !important; width: 100% !important; height: 100vh !important; overflow: hidden !important; }
    .stApp > div:first-child { height: 100vh !important; overflow: hidden !important; }
    div[data-testid="stVerticalBlockBorderWrapper"] { height: 100vh !important; overflow: hidden !important; }
    div[data-testid="stMainBlockContainer"] { overflow: hidden !important; height: 100vh !important; padding: 0 !important; }
    section.main { overflow: hidden !important; }
    .viewerBadge_container__r5tak, .stStatusWidget, footer { display: none !important; }
</style>
""", unsafe_allow_html=True)


def get_xlsx_base64():
    with open("data.xlsx", "rb") as f:
        return base64.b64encode(f.read()).decode()


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
html,body{{height:100vh;width:100%;overflow:hidden;background:#fff;touch-action:manipulation;margin:0;padding:0}}
#luckysheet{{position:fixed;top:0;left:0;right:0;bottom:0;width:100vw;height:100vh}}

/* Light theme (default) — clean Excel look */
.luckysheet-wa-editor,.luckysheet-grid-window{{background:#fff!important}}
.luckysheet-cell-input{{background:#fff!important;color:#222!important}}
.luckysheet-sheets-item{{background:#f0f0f0!important;color:#444!important;border-color:#ccc!important;padding:2px 6px!important;font-size:11px!important;max-width:120px!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}}
.luckysheet-sheets-item-active{{background:#fff!important;color:#1a6b3c!important;border-bottom:2px solid #1a6b3c!important}}
.luckysheet-sheet-area,.luckysheet-sheet-container{{background:#f5f5f5!important;border-color:#ddd!important}}
.luckysheet-sheet-area{{position:fixed!important;bottom:0!important;left:0!important;right:0!important;z-index:9999!important;height:28px!important}}
.luckysheet-toolbar{{background:#f8f8f8!important;border-color:#ddd!important}}
.luckysheet-toolbar-button{{color:#444!important}}
.luckysheet-cols-h-cells,.luckysheet-rows-h{{background:#f0f0f0!important;color:#666!important}}
.luckysheet-scrollbar-x,.luckysheet-scrollbar-y{{background:#eee!important}}
.luckysheet-stat-area{{background:#f5f5f5!important;color:#666!important;border-color:#ddd!important}}
.luckysheet-input-box{{background:#fff!important;color:#222!important;border-color:#ccc!important}}
.luckysheet-wa-functionbox{{background:#f8f8f8!important;border-color:#ddd!important}}
.luckysheet-wa-functionbox-cancel,.luckysheet-wa-functionbox-confirm{{background:#f0f0f0!important;color:#444!important}}
.luckysheet-name-box{{background:#fff!important;color:#222!important;border-color:#ccc!important}}
.luckysheet-toolbar-menu-line{{border-color:#ddd!important}}
.luckysheet-cell-selected{{border-color:#1a73e8!important}}
.luckysheet-column-selected,.luckysheet-row-selected{{background:rgba(26,115,232,0.08)!important}}
.luckysheet-cols-menu,.luckysheet-rightclick-menu{{background:#fff!important;border-color:#ddd!important;color:#333!important;box-shadow:0 2px 8px rgba(0,0,0,0.15)!important}}
.luckysheet-cols-menuitem:hover,.luckysheet-rightclick-menu-item:hover{{background:#e8f0fe!important}}
.luckysheet-modal-dialog{{background:#fff!important;border-color:#ddd!important;color:#333!important}}
.luckysheet-modal-dialog-title-text{{color:#222!important}}
.luckysheet-grid-window-1{{background:#fff!important}}
table.luckysheet-cell-flow{{color:#222!important}}
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
        document.getElementById('luckysheet').innerHTML='<p style="color:#e94560;padding:20px;font-family:sans-serif">Failed to load. Refresh the page.</p>';
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
    // Fix column widths — narrow col A, adjust others
    ej.sheets.forEach(function(sheet) {{
        if (!sheet.config) sheet.config = {{}};
        if (!sheet.config.columnlen) sheet.config.columnlen = {{}};
        
        // Col A (index 0): narrow unless it has real data width needs
        if (!sheet.config.columnlen[0] || sheet.config.columnlen[0] > 140) {{
            sheet.config.columnlen[0] = 140;
        }}
        
        // Analysis & Summary: col E (index 4) = Status, make thin
        if (sheet.name && sheet.name.indexOf('Analysis') !== -1) {{
            sheet.config.columnlen[4] = 55;  // Status column
            sheet.config.columnlen[0] = 120;
            sheet.config.columnlen[1] = 180;
            sheet.config.columnlen[2] = 160;
            sheet.config.columnlen[3] = 180;
            sheet.config.columnlen[5] = 90;  // Risk Level
        }}
        
        // Financial Statements: tighten col A
        if (sheet.name && sheet.name.indexOf('Financial') !== -1) {{
            sheet.config.columnlen[0] = 160;
        }}
        
        // Cash Burn: tighten
        if (sheet.name && sheet.name.indexOf('Cash Burn') !== -1) {{
            sheet.config.columnlen[0] = 150;
        }}
        
        // Peer Analysis
        if (sheet.name && sheet.name.indexOf('Peer') !== -1) {{
            sheet.config.columnlen[0] = 130;
        }}
        
        // Valuation
        if (sheet.name && sheet.name.indexOf('Valuation') !== -1) {{
            sheet.config.columnlen[0] = 130;
        }}
        
        // Management
        if (sheet.name && sheet.name.indexOf('Management') !== -1) {{
            sheet.config.columnlen[0] = 130;
        }}
        
        // Company Overview
        if (sheet.name && sheet.name.indexOf('Company') !== -1) {{
            sheet.config.columnlen[0] = 140;
        }}
        
        // Claude Log
        if (sheet.name && sheet.name.indexOf('Claude') !== -1) {{
            sheet.config.columnlen[0] = 50;
        }}
    }});
    
    window.addEventListener('resize',function(){{try{{window.luckysheet.resize()}}catch(e){{}}}});
}});
</script></body></html>"""

components.html(html, height=2000, scrolling=False)
