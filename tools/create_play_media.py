from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import shutil, zipfile, hashlib
root=Path(__file__).resolve().parents[1]
out=root/"play-store-assets"
out.mkdir(exist_ok=True)
shots=sorted((root/"docs/screenshots").glob("*.jpg"))
if len(shots)<2: raise SystemExit("Not enough real gameplay screenshots")
manifest=[]
for i,p in enumerate(shots,1):
    im=Image.open(p)
    manifest.append(f"{p.name}\t{im.width}x{im.height}")
    shutil.copy2(p,out/f"ASCENSION_GAMEPLAY_{i:02d}.jpg")
icon=Image.open(root/"icons/icon-512.png").convert("RGBA")
icon.save(out/"ASCENSION_PLAY_ICON_512.png")
w,h=1024,500
canvas=Image.new("RGB",(w,h),(222,235,250))
d=ImageDraw.Draw(canvas)
for y in range(h):
    t=y/(h-1)
    d.line((0,y,w,y),fill=(int(246-25*t),int(228+11*t),int(242+10*t)))
shot=Image.open(shots[4]).convert("RGB")
shot.thumbnail((500,438),Image.Resampling.LANCZOS)
plate=Image.new("RGB",(536,466),(252,253,255))
xx=(536-shot.width)//2
yy=(466-shot.height)//2
plate.paste(shot,(xx,yy))
canvas.paste(plate,(465,17))
d=ImageDraw.Draw(canvas)
fonts=["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf","/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf"]
font=next((p for p in fonts if Path(p).exists()),None)
head=ImageFont.truetype(font,58) if font else ImageFont.load_default()
sub=ImageFont.truetype(font,20) if font else ImageFont.load_default()
d.text((54,150),"ASCENSION",font=head,fill=(25,43,66))
d.text((57,248),"ARCHITECTURAL PUZZLES",font=sub,fill=(54,79,111))
d.text((57,288),"ROTATE  •  ALIGN  •  ASCEND",font=sub,fill=(54,79,111))
canvas.save(out/"ASCENSION_FEATURE_GRAPHIC_1024x500.png")
(out/"SOURCE_SCREENSHOTS_MANIFEST.txt").write_text("\n".join(manifest)+"\n")
print("Generated store assets:",sorted(p.name for p in out.iterdir()))
