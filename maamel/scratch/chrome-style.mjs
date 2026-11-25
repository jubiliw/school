export const chromeStyle=`
.ma-block-editor{--line:#c7d7d4;--chrome:#295e80;padding:0;border-radius:12px;overflow:visible;background:#e9eff2}
.ma-block-editor.robot{--chrome:#35474d}
.ma-block-editor .menubar{background:var(--chrome);color:#fff;display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:9px 12px;border-radius:11px 11px 0 0}
.ma-block-editor .menubar strong{padding-inline-end:5px}.ma-block-editor .menubar>label{margin-inline-start:auto}.ma-block-editor .menubar input{width:145px;color:#fff;background:#ffffff15;border-color:#ffffff68;min-height:30px}
.ma-block-editor .block-menu{position:relative}.ma-block-editor .block-menu summary{list-style:none;cursor:pointer;padding:5px 8px;border-radius:5px}.ma-block-editor .block-menu summary:after{content:' ▾'}.ma-block-editor .block-menu[open] summary{background:#ffffff22}
.ma-block-editor .menu-items{position:absolute;z-index:8;min-width:148px;inset-inline-start:0;display:grid;gap:3px;background:#fff;border:1px solid var(--line);box-shadow:0 5px 18px #152e4120;padding:6px;border-radius:6px}
.ma-block-editor .menu-items button{color:#263c45;text-align:start;border:0}.ma-block-editor .menu-items button:hover{background:#e8f2f6}
.ma-block-editor .toolbar-tabs{display:flex;flex-wrap:wrap;gap:2px;border-bottom:1px solid var(--line);padding:5px 10px 0}
.ma-block-editor .toolbar-tabs button{border-radius:7px 7px 0 0;background:#e4edef;border-bottom:0}
.ma-block-editor .toolbar-tabs button[aria-pressed=true]{background:#fff;color:#1f5568;font-weight:bold;box-shadow:inset 0 3px #438aa4}
.ma-block-editor .grid{padding:8px;margin-top:0;grid-template-columns:minmax(165px,.88fr) minmax(180px,1.32fr) minmax(205px,1.25fr);gap:5px}
.ma-block-editor .grid.no-sim{grid-template-columns:minmax(150px,.6fr) minmax(200px,2fr)}
.ma-block-editor .grid[hidden],.ma-block-editor [hidden]{display:none!important}
.ma-block-editor .tools-panel{padding:0;overflow:hidden}.ma-block-editor .tools-panel h3{padding:8px 8px 0}
.ma-block-editor .tool-shelf{display:grid;grid-template-columns:minmax(56px,.7fr) minmax(80px,1.3fr);align-items:start}
.ma-block-editor .groups{display:grid;gap:1px;align-items:start;border-inline-end:1px solid var(--line);padding:3px}
.ma-block-editor .groups button{font-size:12px;font-weight:600;border:0;padding:3px 0;background:transparent;text-align:center;min-height:34px;border-radius:4px}
.ma-block-editor .groups button:before{display:block;margin:auto;content:'';width:10px;height:10px;border-radius:50%;background:var(--category)}
.ma-block-editor .groups .active{background:#e4edf1}.ma-block-editor .palette{margin:0;padding:4px;justify-items:start}
.ma-block-editor .tile,.ma-block-editor .node{position:relative;border:1px solid #0002;box-shadow:inset 0 1px 0 #ffffff45,inset 0 -1px 0 #0001;border-radius:5px}
.ma-block-editor .tile{font-size:13px;min-height:30px;padding:5px 7px;margin-bottom:3px;text-align:start}
.ma-block-editor .tile:after,.ma-block-editor .node:after{content:'';position:absolute;bottom:-4px;inset-inline-start:14px;width:14px;height:4px;background:var(--ink);border-radius:0 0 3px 3px;z-index:1}
.ma-block-editor .node{padding:5px 7px;margin:3px 0}.ma-block-editor .node>strong{cursor:grab}
.ma-block-editor .node .params input,.ma-block-editor .node .params select{border-radius:10px;min-height:26px;padding:2px 6px;font-size:13px}.ma-block-editor .node .params label{font-size:12px}
.ma-block-editor .block-commands{position:relative;margin-top:2px}.ma-block-editor .block-commands summary{cursor:pointer;font-size:12px}
.ma-block-editor .block-commands .commands{padding-top:3px}.ma-block-editor .workspace{min-height:320px}.ma-block-editor .stage{margin-top:4px}
.ma-block-editor .start-hat{background:#a73646;color:#fff;border-radius:14px 8px 4px 4px;padding:4px 12px;display:inline-block;font-weight:bold;margin:6px 0 3px}
.ma-block-editor .studio-pane{margin:8px;background:#fff;border:1px solid var(--line);border-radius:8px;padding:12px}
.ma-block-editor .block-dialog{direction:rtl;width:min(520px,90vw);max-height:85vh;border:1px solid #bed0d5;border-radius:12px;padding:12px;background:#fff;color:#203c39}
.ma-block-editor .block-dialog::backdrop{background:#15344766}.ma-block-editor .block-dialog header{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.ma-block-editor .block-library-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(95px,1fr));gap:7px}.ma-block-editor .block-library-grid button{padding:5px}.ma-block-editor .block-library-grid canvas{cursor:inherit;touch-action:auto}.ma-block-editor button[aria-pressed=true]{border-color:#37778e}
.ma-block-editor .clip{display:flex;align-items:center;gap:5px;flex-wrap:wrap;padding:5px;border-bottom:1px solid var(--line)}.ma-block-editor .clip strong{margin-inline-end:auto}
.ma-block-editor .drop-selected{outline:2px dashed #e0a242}.ma-block-editor .view .start-run{color:#126132;background:#e9f7ed}.ma-block-editor .view .stop-run{color:#9b2431;background:#fff0f0}
.ma-block-editor .view.expanded{position:fixed;z-index:90;inset:1vh 1vw;overflow:auto;box-shadow:0 0 0 100vmax #132c4590}.ma-block-editor .view.expanded .stage{width:min(100%,95vh,900px);margin:auto}
@container(max-width:820px){.ma-block-editor .grid{grid-template-columns:minmax(130px,.7fr) minmax(190px,1.3fr)}.ma-block-editor .view{grid-column:1/-1}}
@container(max-width:470px){.ma-block-editor .grid{grid-template-columns:minmax(0,1fr)}.ma-block-editor .tool-shelf{display:block}.ma-block-editor .groups{display:flex;flex-wrap:wrap;border:0}.ma-block-editor .groups button{min-width:44px}.ma-block-editor .palette{display:flex;flex-wrap:wrap}.ma-block-editor .workspace{min-height:150px}.ma-block-editor .view{grid-column:auto}.ma-block-editor .menubar{gap:2px}.ma-block-editor .menubar input{width:110px}}
`;
