#!/usr/bin/env python3
"""Bundle the original online city lighting locally for identical offline rendering."""
from pathlib import Path
bundle=Path(__file__).resolve().parents[1] / "android/app/src/main/assets/assets/index-BjuLtVzX.js"
source=bundle.read_text()
old='ee.jsx(B4,{preset:"city"})'
assert source.count(old)==1, "Unknown runtime build – refuse speculative modification"
from shutil import copyfile
import hashlib
hdr=Path(__file__).resolve().parent / "bundled-assets/lighting/potsdamer_platz_1k.hdr"
assert hashlib.sha256(hdr.read_bytes()).hexdigest()=="7afe4c2f9700ee78c7477c53fa355463d7dda1fdede401432d6b5f9ff0a95696"
lighting=bundle.parent.parent / "lighting"
lighting.mkdir(exist_ok=True)
copyfile(hdr,lighting / hdr.name)
patched=source.replace(old,'ee.jsx(B4,{files:"./lighting/potsdamer_platz_1k.hdr"})',1)
bundle.write_text(patched)
assert old not in bundle.read_text()
print("PASS: exact original city HDR bundled locally; original lighting settings preserved")

# Load local CSS and fonts in the packaged Android HTML. The browser source
# remains unchanged; the packaged header receives the narrow fixes below.
import re
index=bundle.parent.parent / "index.html"
html=index.read_text()
oldscript='<script src="https://cdn.tailwindcss.com"></script>'
assert html.count(oldscript)==1
html=html.replace(oldscript,'<link rel="stylesheet" href="./ascension-tailwind.css">',1)
html=re.sub(r'<link rel="preconnect" href="https://fonts.googleapis.com">\s*','',html)
html=re.sub(r'<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\s*','',html)
html=html.replace('<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@100;300;400;600&display=swap" rel="stylesheet">','<link rel="stylesheet" href="./local-fonts.css">',1)
# Avoid the implicit /favicon.ico request escaping the /assets/ loader. Reuse
# the exact approved launcher artwork for this local document icon as well.
from shutil import copyfile
approved_icon=Path(__file__).resolve().parents[1] / 'android/app/src/main/res/drawable-nodpi/ascension_launcher.png'
copyfile(approved_icon,index.parent / 'approved-icon.png')
assert '<link rel="icon"' not in html
html=html.replace('</head>','<link rel="icon" type="image/png" href="./approved-icon.png">\n</head>',1)
index.write_text(html)
assert 'cdn.tailwindcss.com' not in html
assert 'local-fonts.css' in html
assert 'rel="preconnect"' not in html, 'Unused remote font preconnect remains'
print("PASS: Android HTML now uses bundled fonts and CSS")

# Keep the last opened level across process death/cold starts. Previously the
# Android game initialized its React level index to zero on every new launch.
bundle_source=bundle.read_text()
old='K4=()=>{const[r,t]=Yt.useState(0),'
assert bundle_source.count(old)==1, 'Unknown level-state initializer'
new='K4=()=>{const[r,t]=Yt.useState(()=>{try{const v=Number(localStorage.getItem("ascension.android.level"));return Number.isInteger(v)&&v>=0&&v<_b.length?v:0}catch{return 0}}),'
bundle_source=bundle_source.replace(old,new,1)
old='x=Yt.useRef(null),v=_b[r];Yt.useEffect(()=>{window.__ASCENSION_LEVEL_COUNT='
assert bundle_source.count(old)==1, 'Unknown level-state persistence insertion'
new='x=Yt.useRef(null),v=_b[r];Yt.useEffect(()=>{try{localStorage.setItem("ascension.android.level",String(r))}catch{}},[r]);Yt.useEffect(()=>{window.__ASCENSION_LEVEL_COUNT='
bundle.write_text(bundle_source.replace(old,new,1))
print('PASS: Android level checkpoint survives cold start; storage failure remains non-blocking')

# Keep level hints within the portrait viewport and maintain readable text on
# the existing dark level-21 theme. No scene geometry or artwork is changed.
bundle_source=bundle.read_text()
old='className:"absolute top-8 left-8 text-gray-700 pointer-events-none z-10",children:'
assert bundle_source.count(old)==1, 'Unknown gameplay header'
new='className:"absolute top-8 left-8 right-8 text-gray-700 pointer-events-none z-10",style:{color:v.theme.bg==="#130f40"?"#f8fafc":"#111827"},children:'
bundle.write_text(bundle_source.replace(old,new,1))
print('PASS: portrait hint width and dark-theme header contrast corrected')

# Keep the required privacy policy discoverable from the landing screen, even
# when the device is offline. The Play Console points to the same public policy.
from shutil import copyfile
copyfile(Path(__file__).resolve().parents[1] / 'privacy.html', index.parent / 'privacy.html')
bundle_source=bundle.read_text()
old='children:ee.jsx("p",{className:"text-[10px] text-black/20 uppercase tracking-[0.3em]",children:"V60 • React • Three.js"})})'
assert bundle_source.count(old)==1, 'Unknown landing footer'
new='children:ee.jsxs(ee.Fragment,{children:[ee.jsx("p",{className:"text-[10px] text-black/20 uppercase tracking-[0.3em]",children:"V60 • React • Three.js"}),ee.jsx("a",{href:"./privacy.html",style:{pointerEvents:"auto",display:"inline-flex",alignItems:"center",justifyContent:"center",minHeight:44,padding:"0 16px",fontSize:10,color:"#475569"},children:"Privacy policy"})]})})'
bundle.write_text(bundle_source.replace(old,new,1))
assert 'href:"./privacy.html"' in bundle.read_text()
print('PASS: landing footer links to bundled offline privacy policy')

bundle_source=bundle.read_text()
for old,new in [
 ('className:"text-sm font-light mt-2 tracking-widest opacity-60",children:', 'className:"text-sm font-light mt-2 tracking-widest opacity-60",style:{opacity:1},children:'),
 ('className:"text-[10px] font-bold tracking-[0.2em] uppercase opacity-50 group-hover:opacity-100 transition-opacity",children:', 'className:"text-[10px] font-bold tracking-[0.2em] uppercase opacity-50 group-hover:opacity-100 transition-opacity",style:{opacity:.85},children:')
]:
    assert bundle_source.count(old)==1, 'Unknown gameplay text style'
    bundle_source=bundle_source.replace(old,new,1)
bundle.write_text(bundle_source)
