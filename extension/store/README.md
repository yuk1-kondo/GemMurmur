# GemMurmur — Chrome Web Store 提出セット

このフォルダには、Chrome Web Store の初回提出に必要な成果物をまとめます。

| 提出物 | ファイル | 用途 |
|---|---|---|
| アップロードZIP | `GemMurmur-v0.10.2-chrome-web-store.zip` | Developer Dashboard の Package にアップロード |
| ストア掲載文 | `listing-ja.md` | Store listing に貼り付け |
| プライバシーポリシー | `privacy-policy-ja.html` | 公開URLでホストし、Privacy practices に登録 |
| データ取扱い回答 | `privacy-practices.md` | Privacy practices フォームへの回答根拠 |
| 審査者向けメモ | `reviewer-notes-ja.md` | 審査フォームの補足・再現手順 |
| 提出手順 | `submission-checklist.md` | 申請前・申請時の確認 |
| 画像素材 | `assets/` | アイコン、スクリーンショット、プロモ画像 |

## 使い方

1. `npm run package:webstore` を実行して ZIP を生成する。
2. `privacy-policy-ja.html` を GitHub Pages 等の公開HTTPS URL にホストする。
3. `listing-ja.md` と `privacy-practices.md` を参照し、Developer Dashboard の各項目を入力する。必要に応じて `reviewer-notes-ja.md` を審査者向け補足として貼り付ける。
4. `submission-checklist.md` の未入力項目（公開URL、サポート連絡先、公開範囲）を決定してから提出する。

ZIP は `manifest.json` がアーカイブ直下にあることを検証します。`extension/` や `dist/` フォルダごと圧縮したZIPは提出しません。
