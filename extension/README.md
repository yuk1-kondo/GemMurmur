# GemMurmur Extension

## Build

```bash
npm install
npm run build
```

**バージョン更新**: `package.json` の `version` を上げてから `npm run build`。ポップアップ右上と `chrome://extensions` の両方に反映されます。

## Load in Chrome

Load the **`dist`** folder (do NOT select the `extension` source folder or the `manifest.json` file):

1. Open `chrome://extensions`
2. Enable Developer mode (top-right)
3. Load unpacked → choose `extension/dist`

```bash
npm run open-extension
```

On macOS you can also double-click `load-in-chrome.command`.

## Checks (CI)

```bash
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm run ci         # lint + typecheck + build + verify
```

## Manual testing

See [docs/MANUAL_TEST_CHECKLIST.md](docs/MANUAL_TEST_CHECKLIST.md) for the full on-device checklist.
