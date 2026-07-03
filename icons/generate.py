# Generates icon128.png per Chrome Web Store guidelines:
# - 96x96 artwork centered in a 128x128 PNG (16px padding per side)
# - subtle white outer glow in the padding so the dark-blue square reads on
#   dark UI backgrounds (the padding band is where CWS expects such effects)
# - 4px bottom bevel, flat front-facing design, no edge stroke, no big shadows
#
# Run from the repo root:  python3 icons/generate.py
# Needs Pillow and a Helvetica-ish TTF/TTC (path below is macOS).

from PIL import Image, ImageDraw, ImageFilter, ImageFont

FONT = '/System/Library/Fonts/Helvetica.ttc'

# Drawn at 512px (4x), downscaled to 128. Artwork spans 64..448 (=> 96px final).
canvas = Image.new('RGBA', (512, 512), (0, 0, 0, 0))

# Subtle white outer glow: blurred silhouette of the square, ~35% peak alpha,
# reaching ~6 final px into the transparent padding.
glow = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
ImageDraw.Draw(glow).rounded_rectangle((64, 64, 447, 447), radius=84, fill=(255, 255, 255, 90))
glow = glow.filter(ImageFilter.GaussianBlur(20))
canvas.alpha_composite(glow)

art = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
d = ImageDraw.Draw(art)

# Base square in a darker blue; the main square sits 16px (4 final px) higher,
# leaving the darker sliver as the bottom bevel.
d.rounded_rectangle((64, 64, 447, 447), radius=84, fill='#1e40af')
d.rounded_rectangle((64, 64, 447, 431), radius=84, fill='#2563eb')

# Crowded tab strip peeking above the browser window (one gold winner tab).
x = 106
for c in ['#93c5fd', '#bfdbfe', '#93c5fd', '#bfdbfe', '#fbbf24', '#93c5fd', '#bfdbfe']:
    d.rounded_rectangle((x, 130, x + 54, 198), radius=14, fill=c)
    x += 42

d.rounded_rectangle((106, 166, 406, 382), radius=30, fill='#f8fafc')

font = ImageFont.truetype(FONT, 110, index=1)
d.text((256, 272), '999+', font=font, fill='#1d4ed8', anchor='mm')

canvas.alpha_composite(art)
icon = canvas.resize((128, 128), Image.LANCZOS)
icon.save('chrome-extension/icon128.png')
icon.save('icons/icon128.png')

# Sanity checks: solid artwork stays inside the central 96x96 box; anything in
# the padding band is only the faint glow; corners stay clean.
a = icon.getchannel('A')
band = [a.getpixel((x, y)) for x in range(128) for y in (*range(16), *range(112, 128))]
band += [a.getpixel((x, y)) for y in range(128) for x in (*range(16), *range(112, 128))]
solid = a.point(lambda v: 255 if v > 128 else 0).getbbox()
print('solid-artwork bbox:', solid)
print('padding band alpha: max', max(band), '(glow only; must stay well under 128)')
print('corner alpha:', a.getpixel((2, 2)))
