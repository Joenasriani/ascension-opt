#!/usr/bin/env bash
set -euo pipefail
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n com.joenasr.ascensionvr/.MainActivity
sleep 17
# Dismiss Android's first-use immersive-mode guidance
adb shell input tap 910 630
sleep 3
adb shell screencap -p /sdcard/ascension-landing.png
adb pull /sdcard/ascension-landing.png ascension-landing.png
# Enter the actual game level
adb shell input tap 540 1330
sleep 12
adb shell screencap -p /sdcard/ascension-level1.png
adb pull /sdcard/ascension-level1.png ascension-level1.png
adb logcat -d > ascension-logcat.txt
python3 -c 'from pathlib import Path; s=Path("ascension-logcat.txt").read_text(errors="replace"); bad=[l for l in s.splitlines() if "FATAL EXCEPTION" in l or "Process: com.joenasr.ascensionvr" in l]; assert not bad, str(bad[:3]); assert Path("ascension-level1.png").stat().st_size>5000; print("PASS: app launched; screenshots captured; no fatal exceptions")'
