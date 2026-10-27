#!/usr/bin/env bash
# Renders every chart in article/charts to a 2x PNG next to it, for blogs that do not take SVG.
# macOS only: Quick Look draws the SVG, ffmpeg crops away the square canvas Quick Look adds.
#
#   ./scripts/bench/charts-png.sh

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CHARTS="$ROOT/article/charts"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

for svg in "$CHARTS"/*.svg; do
  name="$(basename "$svg" .svg)"
  width="$(grep -o 'width="[0-9]*"' "$svg" | head -1 | grep -o '[0-9]*')"
  height="$(grep -o 'height="[0-9]*"' "$svg" | head -1 | grep -o '[0-9]*')"
  size=$((width > height ? width * 2 : height * 2))
  qlmanage -t -s "$size" -o "$TMP" "$svg" >/dev/null 2>&1
  ffmpeg -v error -y -i "$TMP/$name.svg.png" -vf "crop=$((width * 2)):$((height * 2)):0:0" "$CHARTS/$name.png"
  echo "wrote article/charts/$name.png"
done
