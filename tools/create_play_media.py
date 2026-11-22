from PIL import Image, ImageDraw, ImageFont, ImageOps
from pathlib import Path
import hashlib, shutil

root=Path(__file__).resolve().parents[1]
out=root/"play-store-assets"
out.mkdir(exist_ok=True)
source=root/"docs/screenshots"
files=sorted(source.glob("*.jpg"))
assert len(files)==10, f"Expected 10 real gameplay screenshots, found {len(files)}"
# User-approved art direction: actual ASCENSION geometry, not invented scenery.
# Source named 4 is 'The Broken Spire', a real in-game screenshot.
shot=Image.open(source/"ascension_mobile_screenshot (4).jpg").convert("RGB")
assert shot.size==(1440,2560), shot.size

# Official Play listing icon: full-bleed square, opaque sRGB, no lettering.
icon=shot.crop((225,850,1215,1840)).resize((512,512),Image.Resampling.LANCZOS)
icon.save(out/"01_ASCENSION_GOOGLE_PLAY_ICON_512x512.png",optimize=True)

# Feature banner, 1024x500 opaque. Actual captured geometry,
# presented without stretching or adding fictitious gameplay objects.
w,h=1024,500
banner=Image.new("RGB",(w,h))
p=banner.load()
for y in range(h):
    for x in range(w):
        v=y/h
        t=x/w
        p[x,y]=(int(250-10*v),int(224-7*v-5*t),int(236+6*t))
puzzle=shot.crop((175,740,1305,2090))
puzzle=ImageOps.fit(puzzle,(530,525),method=Image.Resampling.LANCZOS)
mask=Image.new("L",puzzle.size,255)
mp=mask.load()
for y in range(525):
    for x in range(530):
        edge=min(x,529-x,y,524-y)
        mp[x,y]=int(255*min(1,edge/62))
banner.paste(puzzle,(500,-5),mask)
d=ImageDraw.Draw(banner)
regular=next((str(p) for p in [Path("/usr/share/fonts/truetype/lato/Lato-Light.ttf"),Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")] if p.exists()),None)
f=ImageFont.truetype(regular,57) if regular else ImageFont.load_default()
sub=ImageFont.truetype(regular,20) if regular else ImageFont.load_default()
small=ImageFont.truetype(regular,16) if regular else ImageFont.load_default()
def tracked(text,x,y,font,spacing,color):
    for letter in text:
        d.text((x,y),letter,font=font,fill=color)
        x+=d.textlength(letter,font=font)+spacing
tracked("ASCENSION",48,175,f,2.2,"#666179")
tracked("REORIENT YOUR REALITY",51,264,sub,2.4,"#797189")
d.line((52,318,397,318),fill="#bb9eaf",width=1)
d.text((52,340),"Architectural Geometry Puzzle",font=small,fill="#817889")
banner.save(out/"02_ASCENSION_FEATURE_GRAPHIC_1024x500.png",optimize=True)

# Copy untouched authentic phone gameplay files.
preferred=["17","4","13","19","22","23","24","7"]
for number,key in enumerate(preferred,1):
    file=source/f"ascension_mobile_screenshot ({key}).jpg"
    im=Image.open(file)
    assert im.size==(1440,2560), f"{file} {im.size}"
    shutil.copyfile(file,out/f"03_ASCENSION_PHONE_{number:02d}_ORIGINAL_GAMEPLAY.jpg")

readme=[
"ASCENSION – GOOGLE PLAY STORE MEDIA – SOURCE VERIFIED",
"App: ASCENSION | Developer: questrequestvr@gmail.com",
"Icon: opaque RGB 512x512 PNG, full square.",
"Feature graphic: opaque RGB 1024x500 PNG.",
"Phone screenshots: 8 original 1440x2560 JPG captures, unmodified.",
"Sources: Joenasriani/ascension-opt original gameplay captures.",
"No invented gameplay screenshots, no stretching.",
"IMPORTANT: Captures are portrait WEB game, whereas Android wrapper is landscape.",
"Verify Android installed gameplay and replace phone screenshots if the Android experience differs.",
"The in-app Android launcher icon is a separate packaging step, not changed by this store listing pack.",
"SHA-256 CHECKSUMS:"
]
for file in sorted(out.iterdir()):
    if file.is_file():
        readme.append(f"{hashlib.sha256(file.read_bytes()).hexdigest()}  {file.name}")
(out/"00_README_VERIFICATION.txt").write_text("\n".join(readme)+"\n")
print("Created store media files:",len(list(out.iterdir())))
