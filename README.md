# Murmur

ローカル LLM（Gemma）でページにライブコメントを流す Chrome 拡張機能。

設計仕様: [Murmur_Product_Spec_v0.1.md](Murmur_Product_Spec_v0.1.md)

## ビルド

```bash
cd extension
npm install
npm run build
```

## Chrome への読み込み

**`extension/dist`** フォルダを読み込んでください（`extension` 直下や `manifest.json` ファイルではありません）。

1. `chrome://extensions` を開く
2. デベロッパーモード ON
3. 「パッケージ化されていない拡張機能を読み込む」→ `extension/dist` を選択

```bash
cd extension
npm run open-extension
```

Mac: `extension/load-in-chrome.command` をダブルクリックでも案内できます。

## ディレクトリ構成

```
Murmur/
├── Murmur_Product_Spec_v0.1.md   # 設計仕様
├── README.md
└── extension/                    # 拡張機能のソース
    ├── src/                      # TypeScript ソース
    ├── dist/                     # ビルド成果物（Chrome に読み込む）
    ├── docs/                     # テストチェックリスト等
    └── scripts/                  # ビルド補助スクリプト
```

## CI

```bash
cd extension
npm run ci
```
