# GemMurmur DESIGN.md

OpenAI / ChatGPT プロダクト UI に寄せたデザインシステム。  
対象: 拡張ポップアップ（主）と状態メッセージ。ページ上の弾幕は「可読なライブコメント」を優先。

---

## 1. Visual Theme & Atmosphere

**静かな研究室の隣にある、白いデモブース。**

- 余白を恐れない。情報は少なく、階層は浅い。
- 黒とオフホワイトが主役。アクセント緑は「準備完了」「主 CTA」だけ。
- 光るネオン、紫グラデ、ガラスモーフィズム、絵文字装飾は禁止。
- 「AI っぽさ」は装飾ではなく、**タイポの落ち着き・線の細さ・コピーの短さ**で出す。
- 密度: Comfortable（拡張幅でも詰め込みすぎない）。1 画面に主操作はひとつ。

ムードキーワード: *calm, precise, local-first, editorial-minimal*

---

## 2. Color Palette & Roles

### 2.1 Light（既定・ポップアップ）

| Token | Hex | Role |
|-------|-----|------|
| `--bg-canvas` | `#F7F7F8` | ページ/ボディ背景（ChatGPT サイドに近い灰白） |
| `--bg-surface` | `#FFFFFF` | メインパネル |
| `--bg-subtle` | `#EFEFEF` | ホバー行、進捗トラック |
| `--text-primary` | `#0D0D0D` | 見出し・本文 |
| `--text-secondary` | `#6E6E80` | タグライン、補助 |
| `--text-tertiary` | `#8E8EA0` | バージョン、hint |
| `--border-hairline` | `#E5E5E5` | 区切り線 |
| `--border-strong` | `#D0D0D0` | 入力枠 |
| `--accent` | `#10A37F` | 主 CTA・Ready ドット（クラシック ChatGPT グリーン） |
| `--accent-hover` | `#0E8F6F` | CTA ホバー |
| `--accent-soft` | `#E7F6F1` | Ready バッジ背景 |
| `--danger` | `#C43C3C` | 破壊操作（モデル削除） |
| `--danger-soft` | `#FCEBEB` | エラー面 |
| `--focus-ring` | `#10A37F66` | フォーカスリング |

### 2.2 Optional Dark（v2.1+）

| Token | Hex |
|-------|-----|
| `--bg-canvas` | `#212121` |
| `--bg-surface` | `#2F2F2F` |
| `--text-primary` | `#ECECF1` |
| `--text-secondary` | `#C5C5D2` |
| `--border-hairline` | `#4A4A4A` |
| `--accent` | `#19C37D` |

MVP は Light 固定でよい。

### 2.3 弾幕カラー（ページ上）

優先順:

1. `#F8F8F8` / `#FFFFFF`（主）
2. `#D0D0D0`（副）
3. まれに `#10A37F`（強調イベントのみ）

赤・紫・虹色の常用はしない（旧実装の多色は廃止方向）。

---

## 3. Typography Rules

### 3.1 フォント

Google Fonts 等で取得可能な組み合わせ（Inter / Roboto / Arial は使わない）。

| Role | Family | Notes |
|------|--------|-------|
| Display / Brand | `"Newsreader", "Source Serif 4", Georgia, serif` | ロゴワード「GemMurmur」のみ。軽めの weight |
| UI Sans | `"Source Sans 3", "Noto Sans JP", "Hiragino Sans", sans-serif` | 本文・ボタン・フォーム |
| Mono (稀) | `"IBM Plex Mono", ui-monospace, monospace` | バージョン、進捗 % |

日本語本文は Noto Sans JP をフォールバックに必ず含める。

### 3.2 スケール（ポップアップ）

| Style | Size / Line / Weight |
|-------|----------------------|
| Brand | 22px / 1.2 / 500（Newsreader） |
| Tagline | 13px / 1.45 / 400（secondary 色） |
| Section label | 11px / 1.3 / 600、letter-spacing 0.04em、uppercase 可 |
| Body | 13px / 1.5 / 400 |
| Button | 13px / 1.2 / 600 |
| Meta | 11px / 1.4 / 400（tertiary） |

コピーは短く。説明文は 1〜2 文まで。

---

## 4. Component Stylings

### 4.1 Popup shell

- Width: `360px`
- Padding: `20px 20px 18px`
- Background: `--bg-surface` on `--bg-canvas`（または surface のみ）
- 角丸: 外側 UI はブラウザ任せ。内部要素は `8px`〜`10px`
- 大きなドロップシャドウは使わない。必要なら `0 1px 2px rgb(0 0 0 / 4%)` まで

### 4.2 Buttons

| Variant | Style |
|---------|-------|
| **Primary** | 背景 `--accent`、文字白、radius 8px、height 36px、幅は状況で full |
| **Secondary** | 白背景、`--border-strong` 1px、文字 primary |
| **Ghost** | 枠なし、文字 secondary、ホバーで subtle 背景 |
| **Danger** | 文字 `--danger`、薄い danger-soft 背景。常用しない |

禁止: フルピル（`999px`）の連打、グラデボタン、アイコン絵文字ボタン。

### 4.3 Switch / Toggle

- iOS っぽくしすぎない。トラック高さ 22px、つまみは円。
- ON 時トラック = `--accent`
- ラベルは「GemMurmur」または「コメント」を左側、トグル右寄せの 1 行

### 4.4 Select / Input

- height 36px、radius 8px、border `--border-strong`
- フォーカス時: border accent + focus-ring
- 背景白

### 4.5 Status chip

- ピルではなく **6px ドット + テキスト**
- Ready: 緑ドット + 「Ready」
- Downloading: 灰ドット + 「Downloading 42%」
- Error: 赤ドット + 短い理由

### 4.6 Progress

- 細いバー（高さ 4px）、トラック `--bg-subtle`、フィル `--accent`
- パーセントは右メタ

### 4.7 Section divider

- カードで囲まない。`border-top: 1px solid var(--border-hairline)` + `padding-top: 14px`

### 4.8 Details (Developer)

- summary は tertiary 色
- 中のデモボタンは secondary の小さめ

---

## 5. Layout Principles

- **1 カラム**、幅固定ポップアップ
- 垂直リズム: 8 / 12 / 16 / 24（4 の倍数）
- Header → Status → Primary → Actions → Language → Model → Privacy → Dev
- 主 CTA はモデル未準備時「モデルを準備する」、Ready 後はトグルが主
- ボタンを 1 行に 3 個以上並べない。どうしても必要なら 2 行へ
- 「カードの入れ子」禁止。フラットなセクションのみ

---

## 6. Depth & Elevation

- 基本フラット
- モーダルなし（ポップアップ自体がユニット）
- 影より **ヘアライン境界** で構造を示す
- アクティブボタンは背景 subtle + border-strong。インセットグロー禁止

---

## 7. Do's and Don'ts

### Do

- ブランド名をヘッダーで一番大きく（ただし騒がしくなく）
- ローカル実行を Privacy note で毎回短く示す
- 状態を文で言い切る（「準備できました」「このページでは停止中」）
- 余白でグループ化する

### Don't

- 紫〜インディゴの AI グラデ
- 暖色クリーム地 + テラコッタ（別ブランド化）
- 絵文字アイコンの羅列
- ガラス・ぼかし・ネオン
- 統計バッジやチップの群れをヘッダーに置く
- Inter / Roboto / Arial を指定する
- 弾幕を虹色パーティにする

---

## 8. Responsive Behavior

- 拡張ポップアップは固定幅。レスポンシブブレークポイントは不要
- 将来 Options ページを作る場合: 最大幅 720px、中央、同じトークン
- 日本語長文ボタンは折り返し可（height auto、min-height 36px）

---

## 9. Motion

意図的に 2〜3 個だけ:

1. トグル ON 時、アクセント色が 150ms ease
2. 進捗バー幅 transition 200ms linear
3. 弾幕入場は既存どおり横移動（ポップアップと世界観を分けてよい）

過剰なフェードやバウンスは禁止。

---

## 10. Copy Voice（OpenAI 感）

- 短文、断定、技術用語は必要最小限
- 英語タグライン維持: `Every page has an audience.`
- Privacy: `Runs locally with Gemma. Page content stays on your device.`
- エラーは謝罪長文にしない。理由 + 次の一手

例:

- ○ `モデルを準備する`
- ○ `Ready`
- ○ `このページでは停止中`
- × `🚀 今すぐ最強AIをダウンロード！！`

---

## 11. Agent Prompt Guide（実装時の短縮指示）

```text
Build the GemMurmur popup using docs/v2/DESIGN.md.
Light OpenAI/ChatGPT aesthetic: off-white canvas, white surface, near-black text,
ChatGPT green (#10A37F) only for primary CTA and Ready state.
Brand wordmark in Newsreader/Source Serif 4; UI in Source Sans 3 + Noto Sans JP.
No purple gradients, no emoji decoration, no card stacks, no Inter/Roboto.
Flat hairline dividers, 8px radius controls, 360px width, generous vertical rhythm.
Follow section order in PRODUCT_SPEC_v2.md §10.
```

---

## 12. 参考ワイヤー（テキスト）

```text
┌──────────────────────────────────┐
│ GemMurmur                   v0.2 │  ← serif brand
│ Every page has an audience.      │
│                                  │
│ ● Ready                          │
│                                  │
│ コメント              [ TOGGLE ] │  ← primary control
│                                  │
│ 一時停止                         │  ← ghost/secondary
│ このページでは停止               │
│ このサイトでは停止               │
│ ─────────────────────────────── │
│ 言語                     [自動 ] │
│ ─────────────────────────────── │
│ ローカルモデル                   │
│ gemma-4-E2B · 端末内             │
│ [ モデルを準備する ]             │  ← primary if not ready
│                                  │
│ Runs locally with Gemma.         │
│ Page content stays on device.    │
│                                  │
│ > Developer                      │
└──────────────────────────────────┘
```
