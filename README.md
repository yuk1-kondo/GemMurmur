# GemMurmur

ローカル LLM（Gemma）でページにライブコメントを流す Chrome 拡張機能。  
**Gem**ma + **Murmur**（ざわめき）= **GemMurmur**。

設計仕様: [Murmur_Product_Spec_v0.1.md](Murmur_Product_Spec_v0.1.md)

## すぐ使う（ビルド不要）

リポジトリを clone / ZIP ダウンロードしたあと、**`extension/dist`** を Chrome に読み込んでください。

1. `chrome://extensions` を開く
2. デベロッパーモード ON
3. 「パッケージ化されていない拡張機能を読み込む」→ `extension/dist` を選択

※ `extension` 直下や `manifest.json` ファイルは選ばないでください。

## ソースからビルドする場合

```bash
cd extension
npm install
npm run build
```

```bash
cd extension
npm run open-extension
```

Mac: `extension/load-in-chrome.command` をダブルクリックでも案内できます。

## ディレクトリ構成

```
Murmur/                           # リポジトリフォルダ名（履歴互換）
├── Murmur_Product_Spec_v0.1.md   # 設計仕様
├── README.md
└── extension/                    # 拡張機能のソース（表示名: GemMurmur）
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
