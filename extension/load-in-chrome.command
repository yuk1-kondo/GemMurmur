#!/bin/bash
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
TARGET="$DIR/dist"
LEGACY="$DIR/chrome-extension"

if [[ ! -f "$TARGET/manifest.json" ]]; then
  osascript -e 'display alert "先に extension フォルダで npm run build を実行してください" as critical'
  exit 1
fi

open "chrome://extensions/"
osascript <<APPLESCRIPT
display dialog "chrome://extensions で「パッケージ化されていない拡張機能を読み込む」を押し、次のフォルダを選択してください。\n\n※ manifest.json ファイルではなく、フォルダを選ぶこと。\n※ extension 直下（src がある場所）は選ばないこと。\n\n推奨:\n$TARGET\n\n旧パス（同じ内容）:\n$LEGACY" buttons {"OK"} default button 1 with title "GemMurmur"
APPLESCRIPT
open "$TARGET"
