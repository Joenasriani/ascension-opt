#!/usr/bin/env python3
"""Android-only hotfix: remove a nonessential remote HDR environment requirement.
The original web runtime remains untouched. Existing ambient and directional lights
are preserved. This removes the external HDR network dependency responsible for
a blank Android 3D scene when the file cannot be fetched.
"""
from pathlib import Path
bundle=Path(__file__).resolve().parents[1] / "android/app/src/main/assets/assets/index-BjuLtVzX.js"
source=bundle.read_text()
old='ee.jsx(B4,{preset:"city"})'
assert source.count(old)==1, "Unknown runtime build – refuse speculative modification"
patched=source.replace(old,"null",1)
bundle.write_text(patched)
assert old not in bundle.read_text()
print("PASS: Android-only HDR dependency removed; game mechanics left untouched")

# Load local CSS and fonts in the packaged Android HTML. The browser source
# remains unchanged, and no gameplay or layout classes are rewritten.
import re
index=bundle.parent.parent / "index.html"
html=index.read_text()
oldscript='<script src="https://cdn.tailwindcss.com"></script>'
assert html.count(oldscript)==1
html=html.replace(oldscript,'<link rel="stylesheet" href="./ascension-tailwind.css">',1)
html=re.sub(r'<link rel="preconnect" href="https://fonts.googleapis.com">\\s*','',html)
html=re.sub(r'<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\\s*','',html)
html=html.replace('<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@100;300;400;600&display=swap" rel="stylesheet">','<link rel="stylesheet" href="./local-fonts.css">',1)
index.write_text(html)
assert 'cdn.tailwindcss.com' not in html
assert 'local-fonts.css' in html
print("PASS: Android HTML now uses bundled fonts and CSS")
