# GemMurmur v2 — プロダクト設計仕様

**Status:** Draft for greenfield rewrite（Codex / 新規リポジトリ用）  
**Date:** 2026-07-22  
**Predecessor:** GemMurmur v0.10.x（Chrome MV3 + ローカル Gemma）  
**Companion:** [DESIGN.md](./DESIGN.md)（OpenAI 調 UI デザインシステム）

---

## 1. プロダクト概要

### 1.1 一言

閲覧中の Web ページに、端末上のローカル LLM（Gemma）が短いライブコメントを流す Chrome 拡張。

### 1.2 ブランド

- **名前:** GemMurmur（Gemma + Murmur）
- **タグライン:** Every page has an audience.
- **約束:** ページ本文はデバイス外に出さない。観客はローカルにいる。

### 1.3 体験の核

ニコニコ動画の弾幕のように、ページ内容と操作に反応する「観客のざわめき」を感じる。  
UI は ChatGPT / openai.com のような **静かな余白・黒白基調・控えめなアクセント** で、拡張ポップアップも「小さな設定アプリ」ではなく「落ち着いたコントロールパネル」にする。

---

## 2. ゴール / ノンゴール

### 2.1 ゴール（v2 MVP）

1. 任意の一般 Web ページで右→左のライブコメントが流れる
2. 初回モデル取得以外、ページ本文・操作ログを外部送信しない
3. ON/OFF・一時停止・ページ/サイト停止・言語切替が直感的
4. プライベートページ（ログイン・決済・メール等）で自動停止
5. 操作イベント（高速スクロール、放置、タブ復帰等）に反応
6. OpenAI 感のあるポップアップ / 状態表示（DESIGN.md 準拠）
7. ZIP 展開 → `dist` 読み込みでビルドなし利用可能

### 2.2 ノンゴール（v2 ではやらない）

- Chrome Web Store 公開フローの完了（将来）
- クラウド推論・アカウント・課金
- モバイル Chrome
- ユーザーが任意モデル URL を自由入力する高度なモデル管理
- SNS への投稿・共有機能
- ページ内容の要約サイドパネル（コメント弾幕以外の主力 UI）

---

## 3. ターゲットユーザー

| セグメント | 動機 |
|-----------|------|
| 技術デモ・ハッカソン来場者 | ローカル LLM の体験をすぐ触りたい |
| 情報収集しながら読む人 | 一人読書に「ざわめき」が欲しい |
| プライバシー意識の高い人 | 本文をクラウドに送りたくない |

---

## 4. ユーザーフロー

### 4.1 インストール

1. GitHub ZIP を展開（または clone）
2. `chrome://extensions` → デベロッパーモード → `extension/dist` を読み込み
3. ツールバーに GemMurmur アイコンが表示される

### 4.2 初回セットアップ（重要 UX）

1. アイコンをクリック → ポップアップが開く
2. ヒーロー: ブランド名 + タグライン + ローカル実行の一文
3. 主 CTA: **モデルを準備する**（ダウンロード + ロード）
4. 進捗はパーセント / 段階ラベル（Downloading → Loading → Ready）
5. Ready 後、トグルが有効化。通常ページを開くとコメント開始

### 4.3 日常利用

1. トグル ON
2. 記事・ドキュメントを閲覧
3. コメントが流れる / 操作に反応
4. 必要なら一時停止・このページ停止

### 4.4 失敗時

| 状態 | 表示 | 次アクション |
|------|------|-------------|
| WebGPU 非対応 | 静かなエラー + 理由 | 対応ブラウザ案内 |
| DL 失敗 | リトライ CTA | 再試行 / 取消 |
| メモリ不足 | 短い説明 | 他タブを閉じる案内 |
| プライベートページ | 「このページでは停止中」 | 操作不要 |

---

## 5. 機能要件

### 5.1 コメント表示

- 右から左へスクロール（弾幕）
- サイズ: small / medium / large / xl（重要度・強調で割当）
- 配置: scroll（通常）/ top / bottom / center（イベント時）
- 色: 白黒基調 + 少数アクセント（DESIGN.md）。虹色の乱用禁止
- レーン衝突を避ける簡易レーン割当
- 文字数: soft ≤ 48 / hard ≤ 64（言語共通の目安）

### 5.2 生成ソース

| source | 役割 |
|--------|------|
| `rule` | モデル未準備・フォールバック。文脈プール + ペルソナ |
| `gemma` | ローカル LLM 生成（主経路） |
| `interaction` | 操作イベント専用の短句 |

### 5.3 言語

- `auto` / `ja` / `en` / `zh-Hans` / `zh-Hant`
- auto はページ言語推定 → 解決言語へ

### 5.4 インタラクションイベント

検知して短クールダウン付きで反応:

- `fast_scroll` / `idle` / `oscillate`
- `tab_return` / `bottom` / `top`
- `rapid_click` / `navigate`
- `mouse_shake` / `mouse_fast`

### 5.5 密度モード

- `normal` → `busy` → `buzz`
- buzz: 長時間アクティブ利用後に密度上昇（例: 60分後に 15分）。離席でリセット

### 5.6 コントロール

- 全体 ON/OFF
- 一時停止 / 再開
- このページで停止 / このサイトで停止
- 言語
- モデル: 読み込み / 再読み込み / 削除 / DL 取消

### 5.7 セーフティ

- プライベートページ自動停止（host / path / password / login form / form-heavy 等）
- 生成テキストの簡易サニタイズ（制御文字・過長カット）
- 同一テキストの再出抑制（時間窓）

### 5.8 Developer demo（折りたたみ）

デモ用強制イベント・強制エラー。本番ユーザーからは目立たせない。

---

## 6. システムアーキテクチャ

### 6.1 全体図

```
┌──────────── Popup (UI) ────────────┐
│  settings / model status / CTA    │
└───────────────┬────────────────────┘
                │ chrome.runtime messages
┌───────────────▼────────────────────┐
│     Service Worker (orchestrator)  │
│  settings, queue, buzz, broadcast │
└───────┬─────────────────┬──────────┘
        │                 │
        ▼                 ▼
┌───────────────┐  ┌─────────────────┐
│ Offscreen Doc │  │ Content Script  │
│ LiteRT / WASM │  │ extract / events│
│ Gemma infer   │  │ overlay render  │
└───────────────┘  └─────────────────┘
```

### 6.2 責務分割（v2 で厳守）

| レイヤ | 責務 | 禁止 |
|--------|------|------|
| `popup` | 表示とユーザー操作のみ | 推論・DOM 抽出 |
| `background` | 設定永続化、生成パイプライン調整、ブロードキャスト | DOM アクセス |
| `offscreen` | モデル I/O と推論 RPC | UI |
| `content` | ページ抽出、イベント検知、描画 | モデルロード |
| `shared` | 型・定数・メッセージ契約・safety | Chrome API への過度な依存 |

### 6.3 メッセージ契約（例）

厳密な tagged union を `shared/messages.ts` に置く。

- Popup → BG: `SETTINGS_PATCH`, `MODEL_LOAD`, `MODEL_DELETE`, `MODEL_CANCEL`, `DEMO_*`
- Content → BG: `PAGE_CONTEXT`, `INTERACTION_EVENT`, `REQUEST_COMMENTS`
- BG → Content: `COMMENT_BATCH`, `SETTINGS_SYNC`, `DENSITY_MODE`, `RUNTIME_STATUS`
- BG ↔ Offscreen: `INFER_REQUEST` / `INFER_RESULT` / `MODEL_PROGRESS`

### 6.4 ストレージ

- `chrome.storage.local`: settings, stopped lists, model cache meta, buzz state
- モデル本体: ブラウザ / LiteRT 側キャッシュ（ページ本文は保存しない、または短寿命）

---

## 7. 生成パイプライン

```
PageContext 抽出
    ↓
Private? → 停止（描画なし）
    ↓
バッファ監視 (min/target/max)
    ↓
不足時: Prompt 組み立て（persona bias + viewport/nearby + constraints）
    ↓
Offscreen Infer → Parse → Sanitize → Dedup
    ↓
失敗時: rule / contextual fallback
    ↓
Content へ batch 配送 → Lane 割当 → Animate
```

### 7.1 キュー目標値（暫定・v0.10 踏襲可）

| 項目 | 値 |
|------|-----|
| batchSize | 8 |
| minBuffer | 4 |
| targetBuffer | 16 |
| maxBuffer | 32 |
| ttlMs | 90_000 |

### 7.2 プロンプト方針

- 短文・一人称でない観客コメント
- ページ固有名詞を適度に拾う
- ソフト疑問形の連発を抑制
- 内部ペルソナは設定 UI に出さない

---

## 8. 技術スタック（推奨）

| 領域 | 選択 |
|------|------|
| 拡張 | Chrome MV3 |
| 言語 | TypeScript（strict） |
| バンドル | Vite + `@crxjs/vite-plugin` |
| 推論 | `@litert-lm/core` + WebGPU |
| モデル | `gemma-4-E2B-it-web`（既存 URL を初期値） |
| 品質 | ESLint + `tsc --noEmit` + build verify script |
| 配布 | `extension/dist` をリポジトリ同梱 or Release zip |

---

## 9. リポジトリ構成（新規プロジェクト）

```text
gemmurmur/                    # 新リポジトリ名（任意）
├── README.md
├── docs/
│   ├── PRODUCT_SPEC_v2.md    # 本仕様
│   └── DESIGN.md             # UI デザインシステム
├── extension/
│   ├── manifest.config.ts
│   ├── popup/                # html/css/ts をまとめ直して可
│   ├── offscreen/
│   ├── src/
│   │   ├── background/
│   │   ├── content/
│   │   └── shared/
│   ├── scripts/
│   └── dist/                 # ビルド成果物（配布用）
└── .github/workflows/ci.yml
```

**原則:** `extension/` 直下に `manifest.json` を置かない。Chrome が読むのは常に `dist/`。

---

## 10. UI 情報設計（ポップアップ）

幅: **360px** 前後。縦に詰めすぎない。セクション間は余白で分離（カードだらけにしない）。

### 10.1 セクション順

1. **Brand header** — GemMurmur / タグライン / バージョン（控えめ）
2. **Status strip** — Ready / Downloading 12% / Private page 等（1行）
3. **Primary control** — 大きな ON トグル（単一の主操作）
4. **Session actions** — 一時停止・このページ停止・このサイト停止（テキストボタン基調）
5. **Language** — セレクト 1 つ
6. **Model** — 状態文 + 主ボタン 1 + 副操作は secondary
7. **Privacy note** — 「Runs locally. Page content stays on your device.」
8. **Developer** — `<details>` 内

詳細トークン・コンポーネントルールは DESIGN.md。

---

## 11. オーバーレイ見た目（ページ上）

- コメントはページを邪魔しすぎない透明度
- フォント: 可読性優先の JP/CN 対応スタック（DESIGN.md）
- OpenAI 感はポップアップが主。弾幕自体は「ライブ感」を優先し、白/薄い色中心
- コントロールチップをページ上に常時出しすぎない（必要なら最小）

---

## 12. プライバシー & セキュリティ

1. ページ本文・抽出テキストを外部 API に送らない
2. 通信はモデルファイル取得（Hugging Face 等）に限定し、UI で明示
3. CSP: `wasm-unsafe-eval` を必要最小限で許可
4. 機密ページで自動停止
5. 設定の stoppedPages / stoppedDomains を尊重

---

## 13. 受け入れ基準（MVP）

- [ ] `npm run ci` が通る
- [ ] `dist/manifest.json` があり、Chrome が unpacked 読み込みできる
- [ ] モデル Ready 後、一般記事で 1 分以内にコメントが流れる
- [ ] プライベートページでコメントが出ない
- [ ] ポップアップが DESIGN.md のトークンに概ね準拠（ライト基調）
- [ ] ON/OFF・一時停止・ページ停止が即時反映
- [ ] WebGPU なしで分かりやすいエラーになる

---

## 14. Codex 実装マイルストーン

| Phase | 成果 | 完了条件 |
|-------|------|----------|
| P0 | スキャフォールド | Vite+CRX、空 popup、SW、CI |
| P1 | UI 殻 | DESIGN.md 準拠 popup（モック状態でよい） |
| P2 | Settings + content overlay | トグルでダミーコメントが流れる |
| P3 | Extract + private + events | 実ページ文脈と停止が動く |
| P4 | Offscreen + model | DL/Load/Infer が動く |
| P5 | Pipeline + fallback | バッファ・バズ・rule フォールバック |
| P6 | Polish + dist 同梱 | README、verify、ZIP 導線 |

**実装ルール（Codex 向け）**

- 仕様と DESIGN.md を正本にする
- 1 Phase = 1 まとまりの PR / コミット列
- `any` 禁止、メッセージ型を先に固定
- popup に推論ロジックを置かない
- ダーク紫グラデ・絵文字だらけ UI・カード乱立をしない

---

## 15. v0.10 からの意識的な変更

| 項目 | v0.10 | v2 |
|------|-------|-----|
| ポップアップ見た目 | ダーク・コンパクト | OpenAI 調ライト + 余白 |
| 情報設計 | ボタン多め | 主操作 1 + 副操作を整理 |
| フォルダ | popup がルート散在 | `popup/` `offscreen/` に整理推奨 |
| 配布 | dist 同梱済み | 同方針を維持 |
| 生成ロジック | 既存資産を参考 | クリーンルーム再実装可（挙動は互換目標） |

挙動互換の優先度: **プライバシー停止 > ローカル推論 > 弾幕体験 > 細かい閾値数値**。

---

## 16. オープンな決定事項

1. 新リポジトリ名（`GemMurmur` 継続 or `gemmurmur-v2`）
2. ライト固定か、ChatGPT 風ダーク切替を v2 に含めるか（推奨: **ライト既定 + 将来ダーク**）
3. dist を git 管理するか、GitHub Releases のみにするか（デモ配布なら git 同梱が楽）

---

## 17. 参考（現行実装の再利用ヒント）

現行 `extension/src` の概念は移植してよいが、**ファイルを丸コピーせず**契約から再設計すること。

- `PageContext` / `CommentDraft` / `DensityMode`
- private 検知パターン
- キュー定数・インタラクション閾値
- ペルソナは内部のみ
