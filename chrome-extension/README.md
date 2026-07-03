# Tabs High Score Counter (Chrome extension)

Counts your open tabs so the site can post a *measured* score instead of a
typed one. Zero API permissions and zero host permissions: without the
`"tabs"` permission Chrome strips URLs and titles from `chrome.tabs.query`,
so the extension can count your tabs but never see what's in them — and it
injects no scripts into any page. The site talks to its service worker
directly with `chrome.runtime.sendMessage(EXTENSION_ID, ...)`, which the
manifest's `externally_connectable` entry restricts to tabshighscore.com.

## Install (unpacked)

1. Open `chrome://extensions`
2. Turn on **Developer mode** (top right)
3. Click **Load unpacked** and select this `chrome-extension/` folder
4. Unpacked copies get a machine-specific extension ID, but the site messages
   the Web Store ID. Point it at your copy once, in the DevTools console on
   the site: `localStorage.tabsExtId = '<your unpacked extension id>'`
5. Refresh the site and submit your score

Note: `externally_connectable` cannot include localhost, so an unpacked
extension only answers the production site, not `wrangler pages dev`.

## Privacy

Privacy policy (also the URL for the Chrome Web Store dashboard's privacy
policy field): https://tabshighscore.com/privacy

## Files

- `manifest.json` — MV3 manifest; `externally_connectable` scoped to the site
- `background.js` — service worker answering "how many tabs?"
