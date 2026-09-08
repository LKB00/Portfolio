#!/bin/zsh
# Render og/card.html to ../og-image.png at exactly 1200x630.
#
# Rendered at 2x and downsampled: Geist at 158px resampled from 2x is
# visibly cleaner than the same text rasterised at 1x, and the file is a
# thumbnail that people will see on retina screens.
#
# Usage:  ./og/build.sh [output.png]
# Needs:  Google Chrome, python3 + Pillow, and a network connection the
#         first time (the card pulls Geist from Google Fonts).
set -e
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
DIR="${0:A:h}"
OUT="${1:-$DIR/../og-image.png}"

"$CHROME" --headless --disable-gpu --hide-scrollbars \
  --force-device-scale-factor=2 --window-size=1200,630 \
  --virtual-time-budget=6000 \
  --screenshot="$OUT.2x.png" "file://$DIR/card.html" >/dev/null 2>&1

python3 - "$OUT" <<'PY'
import sys
from PIL import Image
out = sys.argv[1]
im = Image.open(out + ".2x.png").convert("RGB").resize((1200, 630), Image.LANCZOS)
im.save(out, optimize=True)
print(out, im.size)
PY
rm -f "$OUT.2x.png"
