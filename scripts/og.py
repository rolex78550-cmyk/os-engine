import json, os, sys, textwrap
from PIL import Image, ImageDraw, ImageFilter, ImageFont
pages = json.loads(sys.argv[1]); W, H = 1200, 630
os.makedirs("public/og", exist_ok=True)
serifB = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"; sans = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"; sansB = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
F = lambda p, s: ImageFont.truetype(p, s)
hero = Image.open("public/images/sd_jin_warrior_sunset.jpg").convert("RGB")
hs = hero.resize((int(hero.width * H / hero.height), H)); hs = hs.crop((max(0, hs.width - 520), 0, hs.width, H))
icon = Image.open("public/icons/icon-512.png").convert("RGBA").resize((64, 64))
imask = Image.new("L", (64, 64), 0); ImageDraw.Draw(imask).rounded_rectangle((0, 0, 63, 63), 16, fill=255)
for p in pages:
    bg = Image.new("RGB", (W, H), (6, 4, 3)); bg.paste(hs, (W - hs.width, 0))
    grad = Image.new("L", (W, H), 0); gd = ImageDraw.Draw(grad)
    for x in range(W):
        a = 255 if x < W - 600 else max(0, int(255 * (1 - (x - (W - 600)) / 520)))
        gd.line([(x, 0), (x, H)], fill=a)
    bg = Image.composite(Image.new("RGB", (W, H), (6, 4, 3)), bg, grad)
    glow = Image.new("RGB", (W, H), (0, 0, 0)); ImageDraw.Draw(glow).ellipse((40, 100, 640, 560), fill=(255, 122, 0))
    glow = glow.filter(ImageFilter.GaussianBlur(170)); bg = Image.blend(bg, Image.composite(glow, bg, Image.new("L", (W, H), 55)), 0.6)
    d = ImageDraw.Draw(bg); bg.paste(icon, (72, 60), imask)
    d.text((150, 68), "MENIFEST OS", font=F(sansB, 28), fill=(255, 180, 87))
    d.text((150, 102), p["eyebrow"].upper(), font=F(sans, 15), fill=(200, 190, 180))
    size = 58; lines = textwrap.wrap(p["title"], 22)
    while len(lines) > 3 and size > 40:
        size -= 6; lines = textwrap.wrap(p["title"], int(22 * 58 / size))
    y = 200 if len(lines) >= 3 else 230
    for ln in lines[:3]:
        d.text((72, y), ln, font=F(serifB, size), fill=(255, 255, 255)); y += size + 14
    d.text((72, y + 16), "Free guide · practical steps · the science · a daily routine", font=F(sans, 22), fill=(225, 215, 205))
    px, py = 72, H - 88
    d.rounded_rectangle((px, py, px + 300, py + 48), 24, fill=(255, 122, 0))
    d.text((px + 22, py + 12), "www.menifestos.com", font=F(sansB, 20), fill=(26, 13, 0))
    bg.save(f"public/og/{p['slug']}.jpg", quality=86, optimize=True)
print(f"[og] {len(pages)} images → public/og/")
