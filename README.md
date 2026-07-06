# tabs-high-score

Check your high score of how many tabs you have open.

A single static page on **Cloudflare Pages**, two **Pages Functions**
(`/api/submit`, `/api/leaderboard`), a **Cloudflare D1** database, and a
**zero-permission Chrome extension** that measures the real tab count —
no hand-typed scores. Leaderboard reads are served from the edge cache
(60 s TTL), so the database never feels read traffic. No framework, no build
step, no npm dependencies, no secrets.

## Chrome extension

Scores come from [chrome-extension/](chrome-extension/), a two-file MV3
extension that answers "how many tabs are open?" — and nothing else. It
requests **zero API permissions and zero host permissions**: without the
`"tabs"` permission Chrome strips URLs/titles from `chrome.tabs.query`, so it
can count tabs but never see them, and it injects nothing into any page — the
site messages its service worker directly, with `externally_connectable`
limiting senders to tabshighscore.com. Install: `chrome://extensions` →
Developer mode → Load unpacked → select the folder (see the extension README
for pointing the site at an unpacked copy's ID).

## Deploy

1. **D1** — create the database and apply the schema:

   ```sh
   npx wrangler d1 create tabs-high-score
   # paste the printed database_id into wrangler.toml
   npx wrangler d1 execute tabs-high-score --remote --file=schema.sql
   ```

2. **Pages** — create a Pages project from this repo (no build command; the
   output dir `public` and the D1 binding come from
   [wrangler.toml](wrangler.toml)). If the dashboard build doesn't pick up the
   binding, add it manually: Settings → Bindings → D1 database, name `DB`.
   Direct upload works too: `npx wrangler pages deploy`.

3. **Domains** — attach `tabshighscore.com` to the Pages project as the custom
   domain. For `tabhighscore.com` (and `www` hosts), Pages `_redirects` cannot
   match by hostname, so add a zone-level **Redirect Rule** in the dashboard
   (Rules → Redirect Rules → wildcard): `https://tabhighscore.com/*` →
   `https://tabshighscore.com/${1}`, 301. One rule per extra hostname.

## Local dev

```sh
npx wrangler d1 execute tabs-high-score --local --file=schema.sql
# pages dev doesn't reliably pick up the D1 binding from wrangler.toml,
# so pass it explicitly (the id must match wrangler.toml's database_id):
npx wrangler pages dev --d1 DB=7607a981-5f01-4e1d-a7da-3903106d9470
```

## Tests

```sh
node --test
```

## Abuse protection

The write endpoint (`/api/submit`) is the only path that touches the database,
so it has three layers:

1. **Rate limiting** — a Cloudflare rate-limiting rule on `POST /api/submit`
   (configured in the dashboard) caps requests per IP at the edge, before the
   Function or D1 is reached.
2. **Origin check** — `submit.js` rejects any POST whose `Origin` isn't the
   site (browsers always send it on a fetch; lazy `curl` doesn't). A speed
   bump, not a wall — it's spoofable.
3. **Turnstile** — Cloudflare's bot check, **off until you configure it**:
   - Create a Turnstile widget in the Cloudflare dashboard.
   - Paste its **site key** into `TURNSTILE_SITE_KEY` in `public/index.html`.
   - Set its **secret key** as a Pages env var `TURNSTILE_SECRET`.
   With neither set, the widget isn't rendered and the server skips the check,
   so submits work exactly as before. Set both together to turn it on.

## License

[AGPL-3.0](LICENSE). Because it's a network service, the AGPL's §13 applies:
users interacting with the deployed site are offered its source — the page
footer links to this repository.
