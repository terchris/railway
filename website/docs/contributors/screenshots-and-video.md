---
sidebar_position: 8
---

# Screenshots and video

How the screenshots embedded in the user docs are captured, and how the promo MP4s are built. Both flows are automated — you should never be hand-cropping a PNG or hand-editing a video timeline.

| Script | npm command | Output |
|---|---|---|
| `scripts/capture-screen-docs.mjs` | `npm run docs:screens` | PNGs under `website/static/img/screenshots/` |
| `scripts/build-promo-video.mjs` | `npm run video:promo` | One ≈30–45s wide MP4 per role under `website/static/img/promo/` |

Both scripts are zero-config relative to the repo — they read from the running Next dev server and write directly to the Docusaurus `static/` tree, so the docs site serves the fresh assets without a separate copy step.

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
   - `/` → `rwg-pub-home` (also the wizard's intro step — there's no separate landing)
   - `/thank-you` → `rwg-pub-thank-you`
   - `/thank-you?complete-membership=true` → `rwg-pub-thank-you-membership`
   - Walk the wizard by clicking the Norwegian `Neste` button, capturing each step in the actual order from `src/components/form/persist.ts`: `wizard-activities`, `wizard-about`, `wizard-confirmation`
4. **Admin login** screenshot: `/admin/login?manual=1` → `rwg-adm-login`. The `?manual=1` ensures the picker doesn't auto-redirect.
5. **Bootstrap an admin session** via `GET /api/admin/bootstrap-session`. If this redirects away from `/admin/login`, the session cookie is set and admin captures proceed. If not, the script logs a warning and exits early.
6. **Admin static list**: 20 fixed URL → file pairs in the `adminShots` array (overview, registrations, activities, additional-activities, activity-categories, activity-settings, activities-text, text-content, print-manuscript, print-form, skemadata, app-log, staff, eval-questions, eval-options, languages, membership-statuses, membership-options, no-selected-options, activities-new).
7. **Admin detail pages**: navigate to a list page, find the first `/admin/<plural>/<numeric-id>` link, follow it, capture. Used for `rwg-adm-registration-detail`, `rwg-adm-activity-detail`, plus six others in the `detailRuns` array.

Per-shot wait: 450 ms before screenshot (lets late paints settle). Full-page captures (`fullPage: true`).

### Driving the public wizard through validation gates

The interesting part of the capture script — and the part most directly reusable for end-to-end testing — is how it walks the public registration wizard past its own validation. Each step except `intro` blocks `Neste` unless the form is valid, so a naïve "click Neste four times" script (the original version of this file) ends up capturing the same step twice and reports `wizard-about.png` == `wizard-confirmation.png`.

The wizard order is fixed in [`src/components/form/persist.ts`](https://github.com/terchris/railway/blob/main/src/components/form/persist.ts):

```ts
export const registrationSteps = ["intro", "activities", "about", "confirmation"]
```

`/` lands on `intro`. Each transition has its own gate, enforced by [`goNext()` in `registration-form.tsx`](https://github.com/terchris/railway/blob/main/src/components/form/registration-form.tsx):

| Transition | Gate (`goNext()` check) | What the script does |
|---|---|---|
| `intro → activities` | None | Click `Neste`. |
| `activities → about` | `canLeaveActivities`: ≥1 primary/additional activity selected **or** a positive `no_selected_activity_option_id` | Click the first activity checkbox (`getByRole('checkbox').first()`). |
| `about → confirmation` | `canLeaveAbout`: name ≥2 chars, valid email, phone ≥6 chars, ≥1 language, positive membership status, every select-type evaluation question answered | Fill `#name`/`#email`/`#phone`, click first language checkbox, click first membership radio, pick option index 1 of every `<select>`. |

**Trap to avoid**: the default "(ikke aktuelt — jeg planlegger aktivitet senere)" radio at `#nosel-none` looks like it lets you skip activities, but it sets `no_selected_activity_option_id` to **`null`**, which fails `canLeaveActivities`. The original script used it and that's why `wizard-about` and `wizard-confirmation` ended up identical for months. Use a real activity instead.

### Selector strategy

The script leans on three Playwright locator styles, picked to survive minor markup changes:

| Pattern | Used for | Why |
|---|---|---|
| `page.locator('#id')` / `page.fill('#id', …)` | Stable input ids (`#name`, `#email`, `#phone`) | These ids are part of the form contract — they show up in error messages and labels, so they don't get renamed casually. |
| `page.getByRole('button', { name: 'Neste' })` | The wizard's Neste / Tilbake / Send buttons | Driven by visible label, not selector. Survives className refactors. |
| `page.getByRole('checkbox' \| 'radio').first()` | Anonymous Radix UI inputs (languages, activities, membership) | These don't have stable ids — Radix renders `<button role="checkbox">` without one. Role + ordinal is the best we can do. |

### Wait gates after step transitions

Between clicking `Neste` and capturing the next step, the script waits for a marker that proves the transition actually happened — not a blind `sleep`. Two real gates today:

- **About step**: `await page.waitForSelector('#name', { timeout: 10000 })` — if the script is still on the activities step (validation failed silently), `#name` won't be in the DOM and this throws.
- **Confirmation step**: `await page.getByRole('button', { name: 'Send inn registrering' }).waitFor({ timeout: 10000 })` — the submit button is unique to the confirmation step.

Without these gates the script captures whatever's on screen 450 ms after the click — which on a slow render is the previous step, producing the byte-identical-screenshots bug.

### Admin bootstrap pattern

Admin captures need a session cookie. The script doesn't reimplement login — it uses the already-exposed [`GET /api/admin/bootstrap-session`](https://github.com/terchris/railway/blob/main/src/app/api/admin/bootstrap-session/route.ts) route:

1. `goto('/api/admin/bootstrap-session')` — the route reads `POSTGREST_ADMIN_JWT` (or `POSTGREST_STAFF_JWT_UIS`) from the env, verifies it against `JWT_SECRET`, and sets the `ADMIN_SESSION_COOKIE` before redirecting to `/admin`.
2. After the redirect, `page.url()` includes `/admin` and not `/login` — that's the success check.
3. From that point on, every navigation carries the session cookie automatically, so the 20 entries in `adminShots` just need their paths.

The route is gated by `NODE_ENV === 'development' || ADMIN_BOOTSTRAP_SESSION_FROM_ENV === '1'`. In any non-dev environment, set the env flag explicitly.

### Adding a new admin surface

1. Add the route + screenshot id to the `adminShots` array in `scripts/capture-screen-docs.mjs`:
   ```js
   const adminShots = [
     ["rwg-adm-overview", "/admin"],
     // …existing entries…
     ["rwg-adm-my-new-surface", "/admin/my-new-surface"],
   ]
   ```
2. Run `npm run docs:screens` — the new PNG appears in `website/static/img/screenshots/` (the Docusaurus static tree), ready for the site to serve.
3. Reference it in the relevant surface page + role hubs.

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

## How `npm run video:promo` works

`scripts/build-promo-video.mjs` builds **one wide MP4 per role** — short narrative videos embedded in the user-doc role-hub pages. The script reads PNGs from `website/static/img/screenshots/` and the in-script `ROLES` dictionary, where each role has:

- An **intro slide** (no image, ~4 seconds, navy background, role title + one-line description)
- 4–7 **content slides**, each with `image` and `lines[]` (Norwegian caption text)

Per-slide duration is `SLIDE_SEC` (5s by default). Each video ends up roughly 30–45 seconds — long enough to walk the viewer through the role's main surfaces, short enough to keep attention.

| Role id | Output filename | Embedded on |
|---|---|---|
| `public-wizard` | `railway-promo-public-wizard.mp4` | [`users/public-registration.md`](https://github.com/terchris/railway/blob/main/website/docs/users/public-registration.md) |
| `full-admin` | `railway-promo-full-admin.mp4` | [`users/admin/full-admin.md`](https://github.com/terchris/railway/blob/main/website/docs/users/admin/full-admin.md) |
| `registrations-admin` | `railway-promo-registrations-admin.mp4` | [`users/admin/registrations-admin.md`](https://github.com/terchris/railway/blob/main/website/docs/users/admin/registrations-admin.md) |
| `content-editor` | `railway-promo-content-editor.mp4` | [`users/admin/content-editor.md`](https://github.com/terchris/railway/blob/main/website/docs/users/admin/content-editor.md) |

It uses **ffmpeg-static** (bundled as a devDependency — no system ffmpeg required) and produces each video in 4 passes:

1. Render the intro slide (solid navy + role title) to `website/.video-build/intro-<role>.mp4`.
2. Concatenate the body screenshots into `website/.video-build/body-<role>.mp4`.
3. Stitch intro + body into `website/.video-build/merged-<role>.mp4`.
4. Burn the SRT captions onto the merged video and write the final output to `website/static/img/promo/railway-promo-<role>.mp4`.

The intermediate `.video-build/` directory holds the per-role intermediates and SRT tracks. It's gitignored and safe to delete after a build:

```bash
rm -rf website/.video-build
```

### Caption-strip layout (no overlap with screenshots)

The body slides reserve a **solid-colour strip at the bottom of the frame** for captions — they don't burn on top of the screenshot itself. Best-practice for promo videos: the viewer reads the caption in a clean band, not over busy UI content.

| Frame | Screenshot region | Caption strip |
|---|---|---|
| 1920 × 1080 | 1920 × 840 (top) | 1920 × 240 (bottom) |

Strip colour matches the intro slide: `#0f172a` (SovereignSky-adjacent navy). Captions are white Arial Bold, 32 pt, vertically centred in the strip, with 80 px left/right padding. No text outline — it sits on a solid background, so the legibility-on-busy-content hack isn't needed.

Implementation lives in two ffmpeg filter chains in `scripts/build-promo-video.mjs`:

- `encodeBodySlideVideo` — `scale=w=W:h=imgH:force_original_aspect_ratio=decrease,pad=W:H:…:color=0x0f172a` puts each screenshot inside the top imgH pixels and fills the rest with navy.
- `burnSubtitles` — `subtitles=…:force_style='Alignment=2,MarginV=(stripH-2.4×fontSize)/2,…'` burns the SRT track centred inside the strip.

To change the strip size, edit `captionStripHeight()` near the top of the file. To change the colour, edit `STRIP_COLOR`. Both are single-source.

Captions are **Norwegian** to match the user-doc tree under `/docs/users/`. If a video gets repurposed for cross-org sharing later, rewrite the `lines` array for that role.

### Refreshing the videos

Whenever the screenshots change in a way that affects a role's video (a surface gets a new layout, a new admin screen lands), regenerate:

```bash
npm run video:promo
```

The MP4s overwrite in place in `website/static/img/promo/` — the Docusaurus site picks up the new versions on the next reload, no mirror step required.

### Adding a new role video

1. Add a new entry to the `ROLES` dictionary near the top of `scripts/build-promo-video.mjs`:
   ```js
   "my-new-role": {
     intro_lines: ["Min nye rolle", "Kort beskrivelse av hva rollen gjør."],
     slides: [
       { image: "rwg-adm-overview.png", lines: ["Oversikten du ser når du logger inn."] },
       { image: "rwg-adm-<surface>.png", lines: ["Hva rollen kan gjøre her."] },
       // …
     ],
   },
   ```
2. Run `npm run video:promo` — produces `railway-promo-my-new-role.mp4` in `website/static/img/promo/`.
3. Embed it at the top of the matching role-hub page under `website/docs/users/admin/`.

### Editing the script (slide order, durations, copy)

Per role: edit that role's entry in `ROLES` in `scripts/build-promo-video.mjs`. Slide order is array order; `lines` is the caption text per slide. The intro is built from `intro_lines` on the role itself.

Global pacing: `SLIDE_SEC` (5s) and `INTRO_SEC` (4s) constants near the top of the file apply to every role uniformly. Vary individual slides by extending the script if needed (the original "per-slide `sec`" pattern still works — just override `slidesForRole()` to keep custom `sec` values).

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
website/static/img/screenshots/               # capture output + served by Docusaurus
└── rwg-{adm,pub}-<surface>.png               # PNGs from npm run docs:screens

website/static/img/promo/                     # video output + served by Docusaurus
├── railway-promo-1920-wide.mp4               # from npm run video:promo
└── railway-promo-1080x1920-vertical.mp4

website/.video-build/                         # gitignored ffmpeg intermediates
```

Both scripts write directly into the `static/` tree the docs site serves from — there's only one location for each asset, no manual mirror step.

## Reusing the script for end-to-end tests

The capture script is, mechanically, a happy-path end-to-end test that happens to take screenshots along the way. The same Playwright session that walks the public wizard and the 20 admin surfaces is the natural backbone for a Railway E2E suite — there's no separate test infrastructure to stand up.

What's already in place:

- A Playwright + Chromium dependency in `package.json`.
- A working admin bootstrap pattern that produces a session cookie without driving the login UI.
- Stable selectors for the wizard (`#name`, `#email`, `#phone`, role-based for checkboxes/radios) and admin routes (URL-only).
- Wait gates that fail loudly when a step transition doesn't happen (`waitForSelector`, `waitFor`).
- The Norwegian `Neste` button labelling that won't drift — `getByRole('button', { name: 'Neste' })` survives any markup change that keeps the label.

What's missing if you want to grow this into a proper suite:

- **Assertions.** The script captures and moves on; it doesn't verify that what's on screen matches an expectation. A test would `expect(page.locator('h1')).toContainText('Bekreftelse')` after each transition, fail-fast if the wizard misbehaves.
- **Test isolation.** Each capture-script run shares state with the next (the wizard's localStorage persistence, the admin session cookie). A test runner would use a fresh `BrowserContext` per scenario.
- **Negative cases.** The current script only walks the happy path. An E2E suite would cover validation failures: required-field-missing, invalid email, no language picked, etc.
- **The `/api/registrations` submit path.** The wizard stops at the confirmation screen — it never actually submits. A submit test would tick the consent checkbox and click "Send inn registrering", then verify a `/thank-you` redirect and a new row in `registrations` (via PostgREST anon read, gated by RLS).

When that suite gets written, [`scripts/capture-screen-docs.mjs`](https://github.com/terchris/railway/blob/main/scripts/capture-screen-docs.mjs) is the right starting point — copy its navigation helpers (`goto`, `gotoFirstMatchingHref`) and its admin-bootstrap pattern into the new `tests/e2e/` tree, then layer assertions on top.

The selector and gate decisions documented above are the load-bearing parts; if they hold up for screenshot capture against a real backend, they'll hold up for assertions too.

## Related

- [Writing user docs](writing-user-docs.md) — how to embed these screenshots in the user-doc tree
- [Documentation](documentation.md) — Docusaurus site mechanics
- [API surface](api-surface.md) — what the admin routes the script navigates through actually do
- [`scripts/capture-screen-docs.mjs`](https://github.com/terchris/railway/blob/main/scripts/capture-screen-docs.mjs) and [`scripts/build-promo-video.mjs`](https://github.com/terchris/railway/blob/main/scripts/build-promo-video.mjs) — the scripts themselves
