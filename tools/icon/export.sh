#!/bin/sh
# Rasterise the master icon to the three PNG sizes the game ships.
set -e
cd "$(dirname "$0")"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
for s in 180 192 512; do
  printf '<html><body style="margin:0"><img src="icon.svg" width="%s" height="%s"></body></html>' "$s" "$s" > _icon.html
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --window-size=$s,$s \
    --screenshot="../../clean-hop-v10/icon-$s.png" "file://$PWD/_icon.html"
done
rm _icon.html
