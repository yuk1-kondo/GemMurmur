# GemMurmur promotional video kit

This kit contains 30-second landscape promos, 15-second vertical social cuts, synchronised Japanese and English narration, subtitle tracks, and post captions.

## Build

Run `node promo/scripts/build-promo.mjs` from the workspace root. The script uses the real GemMurmur interface screenshots in `promo/assets/`, animates representative normal and Buzz-mode comments, generates local eSpeak-ng narration fitted to the subtitle timings, and writes MP4s to `promo/output/`.

## Included screen evidence

- `actual-overlay.png`: GemMurmur comment overlay on a webpage.
- `actual-popup-ready.png`: ready local-model state in the extension popup.
- `actual-model-setup.png`: first-run model preparation state.

The ending background was generated with the built-in image generation tool and saved at `promo/assets/gemmurmur-endcard-background.png`.

Each MP4 includes an AAC narration track and a selectable subtitle track, with a matching `.srt` file in `subtitles/`. Install the local narration dependency once with `brew install espeak-ng` before rebuilding.
