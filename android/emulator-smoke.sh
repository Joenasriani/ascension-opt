#!/usr/bin/env bash
set -euo pipefail
# Never depend on emulated shared storage for evidence. Keep diagnostics even
# when launch, rendering, or screencap fails.
mkdir -p android-evidence
ADB=(adb)
if [[ -n "${ANDROID_SERIAL:-}" ]]; then ADB+=(-s "$ANDROID_SERIAL"); fi
run_adb() { timeout 45 "${ADB[@]}" "$@"; }
collect_diagnostics() {
  status=$?
  trap - EXIT
  run_adb logcat -d > android-evidence/logcat.txt 2>&1 || true
  run_adb shell dumpsys activity activities > android-evidence/activities.txt 2>&1 || true
  run_adb shell dumpsys meminfo com.joenasr.ascension > android-evidence/memory.txt 2>&1 || true
  run_adb shell cat /proc/asound/cards > android-evidence/sound-cards.txt 2>&1 || true
  run_adb shell dumpsys audio > android-evidence/audio.txt 2>&1 || true
  run_adb shell dumpsys media.audio_flinger > android-evidence/audio-flinger.txt 2>&1 || true
  run_adb shell df -h > android-evidence/storage.txt 2>&1 || true
  run_adb shell dumpsys SurfaceFlinger > android-evidence/surfaceflinger.txt 2>&1 || true
  if [[ -n "${audio_recorder_pid:-}" ]]; then kill "$audio_recorder_pid" 2>/dev/null || true; fi
  cp /tmp/ascension-pulse.log android-evidence/host-pulse.log 2>/dev/null || true
  cp /tmp/ascension-recorder.log android-evidence/host-recorder.log 2>/dev/null || true
  pactl list short sink-inputs > android-evidence/host-audio-streams.txt 2>&1 || true
  exit "$status"
}
trap collect_diagnostics EXIT
capture() {
  local name="$1"
  for attempt in 1 2 3; do
    if run_adb exec-out screencap -p > "android-evidence/$name.png.tmp"; then
      if python3 - "android-evidence/$name.png.tmp" <<'PY'
import struct, sys, zlib
from pathlib import Path
p=Path(sys.argv[1]); b=p.read_bytes()
assert b[:8] == b'\x89PNG\r\n\x1a\n', 'Invalid PNG signature'
pos=8; image_data=b''; ended=False
while pos < len(b):
    n=struct.unpack('>I', b[pos:pos+4])[0]
    kind=b[pos+4:pos+8]; data=b[pos+8:pos+8+n]
    crc=struct.unpack('>I', b[pos+8+n:pos+12+n])[0]
    assert zlib.crc32(kind+data)&0xffffffff == crc, 'Corrupt PNG chunk'
    if kind == b'IDAT': image_data+=data
    if kind == b'IEND': ended=True
    pos+=12+n
assert ended and len(zlib.decompress(image_data))>5000, 'Incomplete capture'
PY
      then mv "android-evidence/$name.png.tmp" "android-evidence/$name.png"; return 0; fi
    fi
    run_adb get-state || true
    sleep 2
  done
  echo "FAIL: could not capture $name" >&2
  return 1
}
run_adb wait-for-device
run_adb shell wm size 480x854
run_adb shell wm density 187
sleep 30
run_adb shell svc wifi disable
run_adb shell svc data disable
run_adb shell ip route > android-evidence/network-routes.txt
run_adb shell cmd media_session volume --stream 3 --set 15 --get
parec --raw --format=s16le --rate=48000 --channels=2 --device=ascension_ci.monitor > "${ASCENSION_NATIVE_AUDIO}" 2>/tmp/ascension-recorder.log &
audio_recorder_pid=$!
run_adb logcat -c
run_adb install -r android/app/build/outputs/apk/debug/app-debug.apk
python3 - <<'PYICON'
import hashlib, io, json, subprocess, zipfile
from pathlib import Path
raw=subprocess.check_output(['adb','shell','pm','path','com.joenasr.ascension'],timeout=45).decode().strip()
assert raw.startswith('package:') and '\n' not in raw, 'Unexpected installed package path'
apk=subprocess.check_output(['adb','exec-out','cat',raw[len('package:'):]],timeout=45)
z=zipfile.ZipFile(io.BytesIO(apk));names=[n for n in z.namelist() if n.endswith('/ascension_launcher.png')]
assert len(names)==1, 'Installed launcher drawable missing'
icon=z.read(names[0]);digest=hashlib.sha256(icon).hexdigest()
assert digest=='d31d93b3611fd499bcd16ddff23af09351f5c649ee9c43d90a50588a151df10d', 'Installed icon differs from approved artwork'
Path('android-evidence/installed-launcher-icon.png').write_bytes(icon)
Path('android-evidence/installed-package-icon.json').write_text(json.dumps({'package':'com.joenasr.ascension','installed_apk_sha256':hashlib.sha256(apk).hexdigest(),'launcher_resource':names[0],'approved_icon_sha256':digest},indent=2))
print('PASS: actual installed launcher resource matches exact approved icon')
PYICON
run_adb shell settings put secure immersive_mode_confirmations confirmed
run_adb shell am start -W -n com.joenasr.ascension/.MainActivity
sleep 20
run_adb shell cmd media_session volume --stream 3 --set 15 --get
run_adb shell dumpsys audio > android-evidence/audio-before-game.txt
sleep 3
capture landing
# Coordinates refer to the explicit 480x854 portrait test viewport.
run_adb shell input tap 240 474
sleep 15
capture level1
node android/android-gameplay.cjs
run_adb shell pidof com.joenasr.ascension > android-evidence/app-pid.txt
run_adb shell input keyevent KEYCODE_HOME
sleep 2
run_adb shell am start -W -n com.joenasr.ascension/.MainActivity
sleep 5
capture resumed
run_adb logcat -d > android-evidence/logcat.txt
python3 - <<'PY'
from pathlib import Path
s=Path('android-evidence/logcat.txt').read_text(errors='replace')
assert 'ANR in ' not in s, 'ANR found; inspect logcat'
assert 'FATAL EXCEPTION' not in s, 'Fatal exception found; inspect logcat'
assert Path('android-evidence/app-pid.txt').read_text().strip(), 'App process absent'
print('PASS: process, valid screenshots, background/resume scenario completed. Gameplay requires evidence review; this is not a full playthrough.')
PY
