---
sidebar_position: 8
---

# Screenshots and video

How the screenshots embedded in the user docs are captured, and how the promo MP4s are built. Both flows are automated — you should never be hand-cropping a PNG or hand-editing a video timeline.

| Script | npm command | Output |
|---|---|---|
| `scripts/capture-screen-docs.mjs` | `npm run docs:screens` | 36 PNGs under `doc/screenshots/` |
| `scripts/build-promo-video.mjs` | `npm run video:promo` | 2 MP4s under `doc/screenshots/` (wide + vertical) |

Both scripts are zero-config relative to the repo — they read from the running Next dev server and write next to the source.

## Prerequisites

Before running either script:

- **Node 20+**
- **`npm install`** in the repo root (Playwright + ffmpeg-static are devDependencies)
- For `docs:screens` only: the **Next dev server must be running** on `:3010` (`npm run dev`)
- For admin screenshots specifically:
  - `.env` has a valid staff JWT (`POSTGREST_ADMIN_JWT` or `POSTGREST_STAFF_JWT_UIS`) that PostgREST verifies
  - `JWT_SECRET` matches the same secret PostgREST uses
  - In development this Just Works; in any non-`NODE_ENV=development` setup, also set `ADMIN_BOOTSTRAP_SESSION_FROM_ENV=1` so the script can hit `/api/admin/bootstrap-session`
  - PostgREST itself must be green — `npm run smoke:admin` is the canonical pre-check

If admin bootstrap fails, the script writes `rwg-adm-bootstrap-failed.png` and stops without capturing the admin surfaces. The public-form screenshots still get captured before the admin section.

## How `npm run docs:screens` works

`scripts/capture-screen-docs.mjs` is a single ~170-line Node script using Playwright + Chromium (headless). The flow:

1. **Resolve `APP_URL`** from env or default to `http://localhost:3010`.
2. **Launch headless Chromium** at viewport **1440 × 900**, deviceScaleFactor 1.
3. **Public surfaces** (no auth):
   - `/` → `rwg-pub-home`
   - `/thank-you` → `rwg-pub-thank-you`
   - `/thank-you?complete-membership=true` → `rwg-pub-thank-you-membership`
   - Walk the wizard by clicking the Norwegian `Neste` button, capturing each step (`rwg-pub-wizard-intro`, `wizard-activities`, `wizard-about`, `wizard-confirmation`)
4. **Admin login** screenshot: `/admin/login?manual=1` → `rwg-adm-login`. The `?manual=1` ensures the picker doesn't auto-redirect.
5. **Bootstrap an admin session** via `GET /api/admin/bootstrap-session`. If this redirects away from `/admin/login`, the session cookie is set and admin captures proceed. If not, the script logs a warning and exits early.
6. **Admin static list**: 20 fixed URL → file pairs in the `adminShots` array (overview, registrations, activities, additional-activities, activity-categories, activity-settings, activities-text, text-content, print-manuscript, print-form, skemadata, app-log, staff, eval-questions, eval-options, languages, membership-statuses, membership-options, no-selected-options, activities-new).
7. **Admin detail pages**: navigate to a list page, find the first `/admin/<plural>/<numeric-id>` link, follow it, capture. Used for `rwg-adm-registration-detail`, `rwg-adm-activity-detail`, plus six others in the `detailRuns` array.

Per-shot wait: 450 ms before screenshot (lets late paints settle). Full-page captures (`fullPage: true`).

### Adding a new admin surface

1. Add the route + screenshot id to the `adminShots` array in `scripts/capture-screen-docs.mjs`:
   ```js
   const adminShots = [
     ["rwg-adm-overview", "/admin"],
     // …existing entries…
     ["rwg-adm-my-new-surface", "/admin/my-new-surface"],
   ]
   ```
2. Run `npm run docs:screens` — the new PNG appears in `doc/screenshots/`.
3. Copy it to `website/static/img/screenshots/` so the docs site can serve it.
4. Reference it in the relevant surface page + role hubs.

### Adding a new detail page

Detail pages (the per-row edit screens) follow `/admin/<plural>/<id>`. To add one to the capture run:

```js
const detailRuns = [
  // …existing entries…
  ["/admin/my-new-list", "rwg-adm-my-new-detail", /^\/admin\/my-new-list\/\d+$/],
]
```

The script visits the list page, finds the first link matching the regex, navigates to it, and captures.

### Refreshing after a UI change

```bash
npm run dev          # in one terminal
npm run docs:screens # in another, once Next is ready
```

The script overwrites existing PNGs in place. Review the diff visually (most file viewers show a before/after for PNG changes) before committing — a CSS change can shift a 1-pixel border and produce a huge binary diff that you'd rather not commit.

After regenerating, mirror the changed PNGs into `website/static/img/screenshots/`. The two paths must stay in sync.

## How `npm run video:promo` works

`scripts/build-promo-video.mjs` reads PNGs from `doc/screenshots/` and an in-script `SLIDES` array that defines:

- An **intro slide** (no image, ~6 seconds, two lines of caption text)
- ~7 **content slides**, each with `image`, `sec` (duration), and `lines[]` (caption text)

It uses **ffmpeg-static** (bundled as a devDependency — no system ffmpeg required) to:

1. Render each slide to an intermediate MP4 in `doc/screenshots/.video-build/` (gitignored).
2. Concatenate the slides per format.
3. Produce two final outputs in `doc/screenshots/`:
   - `railway-promo-1920-wide.mp4` — 1920 × 1080, landscape, desktop/embed
   - `railway-promo-1080x1920-vertical.mp4` — 1080 × 1920, portrait, mobile-vertical

The intermediate `.video-build/` directory holds the per-slide MP4s, the concat manifest (`merge.txt`, `images.concat`), and captions (`captions.srt`). It's safe to delete after the build:

```bash
rm -rf doc/screenshots/.video-build
```

Captions are **English** — the videos are for cross-org sharing, not local volunteers. The volunteer-facing UI in the screenshots stays Norwegian.

### Refreshing the videos

Whenever the screenshots change in a way that affects the promo (a wizard step gets a new layout, a new public-form screen lands), regenerate:

```bash
npm run video:promo
```

The two MP4s overwrite in place. Mirror them into `website/static/img/promo/` so the docs site embeds the fresh version.

### Editing the script (slide order, durations, copy)

The `SLIDES` array in `scripts/build-promo-video.mjs` is the source of truth for narrative order. Adjust `sec` for pacing, `lines` for copy. The intro slide can be replaced with a different background image — pass an `image` instead of `null` and remove the special-case rendering.

Both `SLIDE_SEC` (3.6s) and `INTRO_SEC` (6s) are constants near the top of the file.

## Troubleshooting

### `[docs:screens] Admin bootstrap failed`

The session-bootstrap endpoint either returned an error or didn't set a valid cookie. Causes, in order of likelihood:

1. **PostgREST is unreachable or its `PGRST_JWT_SECRET` is unbound** — run `npm run smoke:admin` to confirm. If it returns `500 PGRST300 "Server lacks JWT secret"` or `401 role "railway_web_anon" does not exist`, see [INVESTIGATE PostgREST admin connection](../ai-developer/plans/backlog/INVESTIGATE-postgrest-admin-connection.md).
2. **`JWT_SECRET` in `.env` doesn't match what PostgREST verifies** — the staff JWT won't validate, bootstrap rejects it.
3. **`ADMIN_BOOTSTRAP_SESSION_FROM_ENV=1` is needed** — if you're running against a non-dev server, this env flag is required to enable the bootstrap endpoint.

### Wrong port

Both scripts default to `http://localhost:3010`. Override with `APP_URL`:

```bash
APP_URL=http://localhost:3000 npm run docs:screens
```

### `Missing ffmpeg-static binary`

`npm install` didn't fetch the binary for your platform. Reinstall:

```bash
rm -rf node_modules/ffmpeg-static
npm install ffmpeg-static
```

### Playwright can't find a browser

```bash
npx playwright install chromium
```

(Should run automatically on first `npm install`; rerun if it didn't.)

## File-layout reference

```
doc/screenshots/                              # source-of-truth (capture output)
├── README.md                                 # short-form usage note
├── rwg-{adm,pub}-<surface>.png               # 36 files
├── railway-promo-1920-wide.mp4               # 2 files
├── railway-promo-1080x1920-vertical.mp4
└── .video-build/                             # gitignored ffmpeg intermediates

website/static/img/screenshots/               # served by Docusaurus
└── rwg-{adm,pub}-<surface>.png               # mirror of source PNGs

website/static/img/promo/                     # served by Docusaurus
├── railway-promo-1920-wide.mp4               # mirror of source MP4s
└── railway-promo-1080x1920-vertical.mp4
```

The duplication (source + static mirror) is deliberate: `doc/screenshots/` is the **build output**; `website/static/img/` is the **published asset**. The mirror step is manual today; if it becomes painful, automate it in the npm script.

## Related

- [Writing user docs](writing-user-docs.md) — how to embed these screenshots in the user-doc tree
- [Documentation](documentation.md) — Docusaurus site mechanics
- [`scripts/capture-screen-docs.mjs`](https://github.com/terchris/railway/blob/main/scripts/capture-screen-docs.mjs) and [`scripts/build-promo-video.mjs`](https://github.com/terchris/railway/blob/main/scripts/build-promo-video.mjs) — the scripts themselves
