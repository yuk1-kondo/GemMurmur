# Devpost draft — GemMurmur

## Project name

GemMurmur

## Tagline

Every page has an audience.

## Short description

GemMurmur is a Chrome extension that turns everyday browsing into a lightweight shared-viewing experience. It streams short, colourful comments from right to left over a webpage, using a local Gemma model to keep reactions relevant while keeping page content on the device.

## Inspiration

Browsing can be focused and solitary, but some moments deserve a little shared energy: a useful idea, an unexpected fact, a long late-night research session. We wanted to bring the feeling of a live audience to the web without turning the page into a social feed or sending a person's reading activity to a server.

## What it does

- Adds lightweight audience comments that travel from right to left across the current page.
- Uses local Gemma inference to create short reactions that fit the page context.
- Supports a multilingual audience experience across 17 interface and comment languages.
- Gradually raises the energy for long browsing sessions; Buzz mode turns the whole page into a colourful, celebratory comment stream.
- Lets people pause comments or stop them for a page or a site.
- Automatically stays quiet on sensitive pages such as login, payment, and email screens.

## How we built it

GemMurmur is a Manifest V3 Chrome extension built with TypeScript and Vite. The interface uses a small popup for controls and a content-script overlay for the moving comment lanes. A local Gemma 4 E2B model runs through LiteRT-LM with WebGPU, so page text and interaction context remain on the device. The extension uses a rules-based multilingual safety net while the local model is preparing or unavailable, and adapts density and comment style as a session becomes more active.

## Challenges we ran into

The core challenge was making a lively comment stream feel playful rather than disruptive. We tuned lane spacing, comment speed, colour, collision avoidance, and density across normal browsing and full-screen Buzz mode. On-device inference also requires clear readiness states, fallback comments, and careful protection for private pages. Supporting a broad language set meant treating text direction, UI labels, and local internet slang as product behaviours rather than just translation strings.

## Accomplishments that we're proud of

- A local-first experience: page content is not sent to an external API for comment generation.
- A complete normal-to-Buzz interaction that makes long browsing sessions visibly change character.
- A multilingual product surface and comment system, including locale-aware Buzz reactions.
- Protective defaults that mute the extension on sensitive pages.
- A concise, polished visual identity and promotional kit built from real extension screens.

## What we learned

Local models can create a much more trustworthy browser experience when the product makes their boundaries legible. We also learned that motion design is part of product safety: a great live-comment effect needs clear controls, predictable direction, and an easy way to turn the energy down.

## What's next for GemMurmur

We plan to keep refining page-aware reactions, add more user-controlled visual themes and accessibility options, and prepare a store-ready release. We also want to explore opt-in audience presets for activities such as study, live sports, and collaborative research.

## Media to attach

- Demo video: `promo/output/gemmurmur-30s-en.mp4`
- Japanese demo video: `promo/output/gemmurmur-30s-ja.mp4`
- Vertical social cut: `promo/output/gemmurmur-15s-vertical-en.mp4`
- Screenshots: `extension/store/assets/screenshot-01-overlay.png`, `extension/store/assets/screenshot-02-ready.png`, and `extension/store/assets/screenshot-03-model-setup.png`

## Links

Add the public repository URL and deployed/download URL once they are available. No placeholder links are included intentionally.
