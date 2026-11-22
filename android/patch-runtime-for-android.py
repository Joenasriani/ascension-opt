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
