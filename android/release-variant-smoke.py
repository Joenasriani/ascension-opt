#!/usr/bin/env python3
"""Native release-variant smoke test. No WebView debugger or gameplay hooks."""
import array, hashlib, io, json, os, re, subprocess, sys, time, wave, zipfile
from pathlib import Path
out=Path('release-variant-evidence');out.mkdir(exist_ok=True)
report={'variant':'release','qaCertificate':'temporary Android debug certificate; not the upload key','debuggerUsed':False,'nativeActions':[]}
def adb(*args):return subprocess.check_output(['adb',*args],timeout=45)
def capture(name):
 errors=[]
 for attempt in range(3):
  try:
   b=adb('exec-out','screencap','-p');assert b.startswith(b'\x89PNG\r\n\x1a\n') and b.endswith(b'IEND\xaeB`\x82')
   p=out/(name+'.png');p.write_bytes(b);return p
  except Exception as e:errors.append(str(e));time.sleep(2)
 raise RuntimeError('Native screenshot capture failed: '+str(errors))
def text(p):return ' '.join(subprocess.check_output(['tesseract',str(p),'stdout','--psm','11'],stderr=subprocess.DEVNULL,timeout=30).decode().upper().split())
def tap(x,y):adb('shell','input','tap',str(x),str(y));time.sleep(1.8)
def audio(name,mark):
 b=raw.read_bytes();data=b[mark//4*4:len(b)//4*4];samples=array.array('h',data)
 if sys.byteorder!='little':samples.byteswap()
 peak=max((abs(v) for v in samples),default=0);rms=(sum(v*v for v in samples)/len(samples))**.5 if samples else 0
 with wave.open(str(out/(name+'.wav')),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(48000);w.writeframes(data)
 r={'seconds':len(data)/192000,'peak':peak,'rms':rms};r['pass']=r['seconds']>=2 and peak>=16 and rms>=3;return r
raw=Path('/tmp/ascension-release-native.pcm');record=None
try:
 adb('wait-for-device');adb('root');adb('wait-for-device');adb('shell','wm','size','480x854');adb('shell','wm','density','187');time.sleep(30)
 adb('shell','svc','wifi','disable');adb('shell','svc','data','disable');adb('logcat','-c')
 record=subprocess.Popen(['parec','--raw','--format=s16le','--rate=48000','--channels=2','--device=ascension_ci.monitor'],stdout=raw.open('wb'),stderr=(out/'recorder.log').open('wb'))
 apk=Path(sys.argv[1]);adb('install','-r',str(apk))
 installed=adb('shell','pm','path','com.joenasr.ascension').decode().strip().removeprefix('package:')
 z=zipfile.ZipFile(io.BytesIO(adb('exec-out','cat',installed)))
 icon=next(z.read(n) for n in z.namelist() if n.endswith('.png') and hashlib.sha256(z.read(n)).hexdigest()=='d31d93b3611fd499bcd16ddff23af09351f5c649ee9c43d90a50588a151df10d')
 hdr=z.read('assets/lighting/potsdamer_platz_1k.hdr');assert hashlib.sha256(hdr).hexdigest()=='7afe4c2f9700ee78c7477c53fa355463d7dda1fdede401432d6b5f9ff0a95696'
 report['originalOnlineEnvironmentBundled']=True
 report['installedIconSHA256']=hashlib.sha256(icon).hexdigest();assert report['installedIconSHA256']=='d31d93b3611fd499bcd16ddff23af09351f5c649ee9c43d90a50588a151df10d'
 report['installedAPK_SHA256']=hashlib.sha256(apk.read_bytes()).hexdigest()
 report['payloadSHA256']={n:hashlib.sha256(z.read(n)).hexdigest() for n in z.namelist() if n.endswith('.dex') or n.startswith('assets/')}
 adb('shell','settings','put','secure','immersive_mode_confirmations','confirmed')
 adb('shell','am','start','-W','-n','com.joenasr.ascension/.MainActivity');time.sleep(20)
 pid=adb('shell','pidof','com.joenasr.ascension').decode().strip().split()[0]
 sockets=adb('shell','cat','/proc/net/unix').decode();report['releaseDebuggerDisabled']='@webview_devtools_remote_'+pid not in sockets
 capture('release-landing')
 mark=raw.stat().st_size;tap(240,474);time.sleep(8);p=capture('release-level1')
 assert 'BROKEN' in text(p),'Native BEGIN did not reveal level 1'
 report['nativeMusic']=audio('release-native-music',mark)
 tap(80,139);p=capture('release-music-off');assert 'OFF' in text(p),'Music off control not observed'
 mark=raw.stat().st_size
 # Replay the four level-1 taps measured in the native API36 run. Same 480x854
 # viewport and density; no DOM events, level shortcuts or state setters.
 for x,y in [(339,328),(278,296),(278,274),(278,382)]:tap(x,y);report['nativeActions'].append([x,y])
 p=capture('release-level1-complete');assert 'LEVEL COMPLETE' in text(p),'Release level 1 did not complete'
 report['level1Completed']=True;report['nativeSfx']=audio('release-native-sfx',mark)
 adb('shell','input','keyevent','KEYCODE_HOME');time.sleep(2);adb('shell','am','start','-W','-n','com.joenasr.ascension/.MainActivity');time.sleep(3)
 assert 'LEVEL COMPLETE' in text(capture('release-resumed')),'Release resume lost the completion screen';report['resume']=True
 adb('shell','am','force-stop','com.joenasr.ascension');adb('shell','am','start','-W','-n','com.joenasr.ascension/.MainActivity');time.sleep(6);tap(240,474);time.sleep(5)
 assert 'BROKEN' in text(capture('release-cold-restart')),'Release cold restart did not restore level 1';report['coldRestart']=True
 log=adb('logcat','-d').decode(errors='replace');(out/'logcat.txt').write_text(log);assert 'ANR in ' not in log and 'FATAL EXCEPTION' not in log,'Native release run contains ANR/fatal exception'
 assert report['releaseDebuggerDisabled'],'Release WebView unexpectedly exposes a debugger'
 report['audioGate']='Reported separately: physical Android music and sound confirmed by user; emulator PCM remains diagnostic only'
 report['pass']=True;print('PASS: release variant startup, native level 1, resume and restart; original online HDR bundled; debugger disabled')
except Exception as e:
 report['pass']=False;report['error']=str(e)
 try:capture('failure')
 except Exception:pass
 print('FAIL:',type(e).__name__,str(e))
finally:
 if record:record.terminate();record.wait(timeout=10)
 (out/'release-variant-report.json').write_text(json.dumps(report,indent=2)+'\n')
 try:
  (out/'logcat.txt').write_bytes(adb('logcat','-d'))
  (out/'sound-cards.txt').write_bytes(adb('shell','cat','/proc/asound/cards'))
  (out/'sound-pcm.txt').write_bytes(adb('shell','cat','/proc/asound/pcm'))
  (out/'audio.txt').write_bytes(adb('shell','dumpsys','audio'))
  (out/'audio-flinger.txt').write_bytes(adb('shell','dumpsys','media.audio_flinger'))
  (out/'kernel.txt').write_bytes(adb('shell','dmesg'))
 except Exception:pass
sys.exit(0 if report.get('pass') else 1)
