# Chrome Web Store 提出チェックリスト

## 提出前に決めること

- [ ] 開発者名（Chrome Web Storeの表示名）
- [ ] プライバシーポリシーの公開HTTPS URL
- [ ] サポートURLまたは問い合わせ先
- [ ] 初回公開範囲（推奨: Private trusted testers → Unlisted → Public）
- [ ] 対象地域と成熟コンテンツ設定（GemMurmurは成熟コンテンツなし）

## Package

- [ ] `npm run ci` が成功している
- [ ] `npm run package:webstore` を実行した
- [ ] `GemMurmur-v0.10.2-chrome-web-store.zip` の直下に `manifest.json` がある
- [ ] ZIPにソース、`node_modules`、`.DS_Store`、テスト用ファイルが含まれていない
- [ ] 初回モデル取得・WebGPUが必要なことを説明文に記載した

## Store listing

- [ ] `listing-ja.md` の短い説明と詳細説明を入力した
- [ ] カテゴリを Productivity に設定した
- [ ] アイコン `assets/icon-128.png` を設定した
- [ ] 1280x800のスクリーンショットを1〜3枚以上設定した
- [ ] 小プロモ画像（440x280）を設定した
- [ ] マーキー画像（1400x560、任意）を設定した
- [ ] 実装にない機能、提携、性能、ランキングを記載していない

## Privacy practices

- [ ] `privacy-policy-ja.html` を公開HTTPS URLにホストした
- [ ] Privacy policy URLに公開URLを入力した
- [ ] Webサイトのコンテンツを「扱う」と回答した
- [ ] 閲覧アクティビティを「扱う」と回答した
- [ ] 外部送信しないこと、端末内処理であることを説明した
- [ ] 初回のモデル取得先（Hugging Face）を説明した
- [ ] Limited Use認証文を実装と一致する形で入力した

## 実機・審査対応

- [ ] WebGPU対応のデスクトップChromeで初回モデル取得を確認した
- [ ] 通常ページでコメントが流れることを確認した
- [ ] ログイン・決済・メールページで停止することを確認した
- [ ] モデル削除、再読み込み、取消、ページ停止、サイト停止を確認した
- [ ] 審査担当者向けの再現手順を必要に応じて用意した
- [ ] `reviewer-notes-ja.md` を審査フォームの補足欄へ貼り付けた（補足欄がある場合）
- [ ] 提出後はPrivate trusted testersで先に確認する

## 重要な未完了事項

このリポジトリには、公開済みのポリシーURL、サポートURL、Chrome Web Store開発者アカウント情報は含まれません。これらは所有者の情報に依存するため、提出直前に設定してください。
