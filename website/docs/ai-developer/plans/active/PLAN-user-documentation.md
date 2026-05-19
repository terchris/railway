# Feature: User documentation, one section per role

> **IMPLEMENTATION RULES:** Before implementing this plan, read and follow:
> - [WORKFLOW.md](../../WORKFLOW.md) - The implementation process
> - [PLANS.md](../../PLANS.md) - Plan structure and best practices

## Status: Backlog

**Goal**: Author the end-user documentation tree under `website/docs/users/`, organised hybrid-style (per-role hubs + per-surface detail pages), in Norwegian, using the 36 existing screenshots + 2 promo MP4s under `doc/screenshots/`. Bundle two new contributor guides (style guide for writing user docs + automation walkthrough for the screenshot/video scripts). One PR at the end; six sequential phases internally.

**Last Updated**: 2026-05-19

---

## Overview

Builds on [`INVESTIGATE-user-documentation.md`](../backlog/INVESTIGATE-user-documentation.md) (decisions captured there). The PLAN locks in:

- **Audiences**: 1 public + 5 staff role hubs from the dummy-login picker.
- **IA**: `users/index.md` → 6 role hubs (`users/public-registration.md`, `users/admin/{full-admin,registrations-admin,content-editor,app-log-viewer,users-admin}.md`) → 21 surface pages (`users/surfaces/<surface>.md`).
- **Language**: Norwegian under `users/`. English elsewhere.
- **Tone**: end-user, "what to click" prose. Not technical-spec.
- **Promo videos**: embedded as intro material in `getting-started.md`.
- **Contributor companions**: `writing-user-docs.md` (style guide) and `screenshots-and-video.md` (automation walkthrough).

Total file count: ~30 new docs files + 2 new contributor guides + 1 rewritten landing page. One PR.

---

## Phase 1: Template proof — public registration — DONE

The simplest audience (no login, one wizard) becomes the worked example that every later page is patterned on.

### Tasks

- [x] 1.1 Create `website/docs/users/_category_.json` with sidebar label "Brukerguider" and position 3.
- [x] 1.2 Create `website/docs/users/index.md` — audience landing page in Norwegian. Two top-level audiences.
- [x] 1.3 Create `website/docs/users/public-registration.md` — full walkthrough of the wizard, all 7 wizard screenshots inline, both thank-you variants, FAQ with three starter questions.
- [x] 1.4 Copied 7 public-form PNGs to `website/static/img/screenshots/`. Plus `rwg-adm-login.png` (referenced from the users-landing audience-selector).
- [x] 1.5 Embedded both promo MP4s in `getting-started.md` (wide + vertical) using native `<video>` tags. MP4s copied to `static/img/promo/`.
- [x] 1.6 Replaced the planning-anchor stub at `website/docs/getting-started.md` with real intro: "Velkommen til Railway" + both videos + three-audience selector table.
- [x] 1.7 *Phase-1 scope add:* placeholder `website/docs/users/admin/_category_.json` + `website/docs/users/admin/index.md` so the `admin/index.md` link from the users-landing resolves. Will be expanded in Phase 3.

### Validation

- `npm run build` in `website/` passes; no broken-link warnings.
- The page at `/docs/users/public-registration` shows all 7 wizard screenshots inline and reads as a self-contained walkthrough.
- A reader who has never seen Railway can follow the public-registration page and identify each wizard step from the screenshot.

---

## Phase 2: Contributor docs — writing + automation

The style guide and the screenshot-automation walkthrough that future contributors (and the designer) read before extending Phases 3-6.

### Tasks

- [ ] 2.1 Create `website/docs/contributors/writing-user-docs.md` (sidebar position 7, after `documentation.md`). Sections:
  - Hvem skriver vi for — audience-by-role framing.
  - Norwegian voice (formal-friendly "du", short sentences, present tense for instructions, imperative for steps).
  - Per-role hub template (verbatim from the investigation, refined against the Phase-1 worked example).
  - Per-surface page template (same).
  - Screenshot embedding conventions:
    - Source files live in `doc/screenshots/`; served versions live in `website/static/img/screenshots/`.
    - Use the filename slug as alt text (`alt="rwg-pub-wizard-intro"`).
    - Max display width 720 px (`<img>` style or markdown image syntax); the source PNGs are higher resolution for retina.
    - Always include a one-line caption describing what the screenshot proves.
  - How to add a new role page (use the public-registration page as the worked example to copy from).
  - How to handle UI-text references — quote Norwegian strings verbatim in `code` styling so the reader can search them.
- [ ] 2.2 Create `website/docs/contributors/screenshots-and-video.md` (sidebar position 8). Sections:
  - Quick reference — `npm run docs:screens` and `npm run video:promo` one-liner descriptions.
  - Prerequisites — Next dev server on :3010, env vars (`POSTGREST_ADMIN_JWT` / `POSTGREST_STAFF_JWT_UIS` matching `JWT_SECRET`), `ADMIN_BOOTSTRAP_SESSION_FROM_ENV=1` for non-dev environments, Playwright installed (already in `package.json`).
  - How the capture script works — points at `scripts/capture-screen-docs.mjs`, names the entry list, describes naming conventions (`rwg-{adm,pub}-<surface>.png`).
  - How to add a new screenshot — extend the capture-list array, run `npm run docs:screens`, commit the new PNG.
  - How the video script works — points at `scripts/build-promo-video.mjs`. Documents the intermediate `.video-build/` directory (gitignored) and the two output MP4s (wide + vertical).
  - How to regenerate when the UI changes — full sweep, diff PNGs visually, commit.
  - Troubleshooting — common failure modes (admin bootstrap fails, ffmpeg missing, wrong port).
- [ ] 2.3 Update `website/docs/contributors/index.md` to link both new guides from the "Guides" list.

### Validation

- Both guides build cleanly with no broken links.
- A second contributor can use `writing-user-docs.md` to extend a role hub (validated indirectly through Phases 3-5).

---

## Phase 3: Admin scaffolding — all hubs + surface stubs

Lay out all the empty role hubs and all 21 surface pages as stubs (frontmatter + one-line description + screenshot + "TBD" body) so the IA is visible in the sidebar before content lands.

### Tasks

- [ ] 3.1 Create `website/docs/users/admin/_category_.json` (sidebar label "Administrasjon").
- [ ] 3.2 Create `website/docs/users/admin/index.md` — admin audience landing. Brief Norwegian intro: "Du er innlogget som …", links to the 5 role hubs with one-paragraph descriptions and capability lists.
- [ ] 3.3 Create the 5 role-hub stubs (`website/docs/users/admin/{full-admin,registrations-admin,content-editor,app-log-viewer,users-admin}.md`). Each: frontmatter, H1, "Hva denne rollen kan" with a placeholder capability table, "Sidebar-elementer du ser" with placeholder list, all referenced screenshots inline at low priority.
- [ ] 3.4 Create `website/docs/users/surfaces/_category_.json` (sidebar label "Skjermbilder").
- [ ] 3.5 Create the 21 surface stub pages with this minimal shape:
  ```markdown
  ---
  sidebar_position: <n>
  ---
  # <Skjermnavn> — `/admin/<path>`
  **Hvem ser dette:** `<role list>`
  **Krever kapabilitet:** `<cap>`
  ![](/img/screenshots/rwg-adm-<surface>.png)
  > TBD — fylles ut i Phase 4.
  ```
  Surfaces (each gets its own file, see investigation §"Per-surface page template" for full list):
  - overview, login, staff
  - registrations, registrations-export (no screenshot yet — flag in stub)
  - activities, activity-categories, activity-settings, additional-activities, activities-text
  - text-content, skemadata
  - eval-questions, eval-options
  - membership-options, membership-statuses
  - no-selected-options
  - languages
  - print-manuscript, print-form
  - app-log
- [ ] 3.6 Copy all 29 `rwg-adm-*.png` files to `website/static/img/screenshots/` (alongside the 7 public ones from Phase 1).

### Validation

- `npm run build` passes.
- Visiting any of the new stub pages in the dev server renders the screenshot and the TBD note. Sidebar shows the full tree.

---

## Phase 4: Surface fill — write the 21 surface pages

Each surface page gets the full "What this screen does / What you'll see / Common tasks / Gotchas / Related" structure from the template.

### Tasks

- [ ] 4.1 Fill `users/surfaces/overview.md` first — it's the most-linked-from page (every role hub points at it).
- [ ] 4.2 Fill `users/surfaces/login.md` and `users/surfaces/staff.md` — the auth surfaces, also linked from every role hub.
- [ ] 4.3 Fill the Registreringer surfaces: `registrations.md`, `registrations-export.md`.
- [ ] 4.4 Fill the content/aktivitet surfaces: `activities.md`, `activity-categories.md`, `activity-settings.md`, `additional-activities.md`, `activities-text.md`, `text-content.md`, `skemadata.md`.
- [ ] 4.5 Fill the evaluation surfaces: `eval-questions.md`, `eval-options.md`.
- [ ] 4.6 Fill the membership surfaces: `membership-options.md`, `membership-statuses.md`.
- [ ] 4.7 Fill `no-selected-options.md`.
- [ ] 4.8 Fill `languages.md`.
- [ ] 4.9 Fill the print surfaces: `print-manuscript.md`, `print-form.md`.
- [ ] 4.10 Fill `app-log.md` — note the open `INVESTIGATE-app-log-alert-count-permission` (the page should describe expected behaviour after that's resolved; flag the current bug).

### Validation

- Each surface page passes a "fresh reader" check: a tester who hasn't seen the surface can identify what it does, what buttons exist, and one common task.
- `npm run build` passes.
- Sidebar reflects the full tree.

---

## Phase 5: Role-hub fill — write the 5 admin role hubs

Now that all linked-to surface pages exist, the hubs can be written confidently (no dead links to "TBD" pages).

### Tasks

- [ ] 5.1 Write `users/admin/full-admin.md` — the broadest hub, links to every surface.
- [ ] 5.2 Write `users/admin/registrations-admin.md` — only Oversikt + Registreringer + Konto.
- [ ] 5.3 Write `users/admin/content-editor.md` — Oversikt + Utskrift + Aktivitet og skjema + Konto.
- [ ] 5.4 Write `users/admin/app-log-viewer.md` — Oversikt + Drift + Konto.
- [ ] 5.5 Write `users/admin/users-admin.md` — Oversikt + Konto only; note the absence of users:*-gated sidebar items today.

Every hub follows the template from `writing-user-docs.md` (Phase 2): login section, "Hva du kan se" section with per-group thumbnail + link, "Hva du ikke kan" section listing missing capabilities, "Relatert" links to login and staff surface pages.

### Validation

- Each hub reads end-to-end as a single short page (target: under 300 words of prose + the screenshots).
- `npm run build` passes.
- Cross-check against `testing-dummy-login.md` — the sidebar shape claims in each hub should match the test spec's expectations.

---

## Phase 6: Cross-linking + polish

The site becomes navigable from any entry point.

### Tasks

- [ ] 6.1 Update `website/docs/getting-started.md` from its current Phase-1 form (videos + audience selector) to the final form: short Norwegian welcome, both promo videos, three audience cards (Frivillige → public-registration; Stab → admin/index; Utviklere → contributors/index), and a brief "om denne nettsiden" footer.
- [ ] 6.2 Update `website/docs/index.md` (the `slug: /` page) to redirect or expand to point at the audience landing in `users/`.
- [ ] 6.3 Add cross-references:
  - From `contributors/postgres-roles.md` → "End-user docs for each role: `users/admin/<role>.md`".
  - From `contributors/testing-dummy-login.md` → "User-facing description of each role's sidebar: `users/admin/<role>.md`".
  - From `users/admin/<role>.md` → "Functional test spec: `contributors/testing-dummy-login.md`".
- [ ] 6.4 Verify all internal links resolve (`onBrokenLinks: 'throw'` will catch breaks at build time).
- [ ] 6.5 Run a final `npm run build` and visually spot-check the rendered site at `:3011`.

### Validation

- Every page in `users/` is reachable from `/docs/getting-started` within at most three clicks.
- `npm run build` passes with zero broken-link warnings.
- The sidebar tree, when expanded, shows: getting-started → users (with public-registration + admin tree + surfaces) → contributors → ai-developer.

---

## Acceptance Criteria

- [ ] `website/docs/users/` exists with the file tree from §Overview.
- [ ] All 36 PNGs and 2 MP4s are embedded somewhere in the docs and reachable from `/img/...`.
- [ ] Every page is Norwegian under `users/`; English under `contributors/` and `ai-developer/`.
- [ ] Both contributor companion docs (`writing-user-docs.md`, `screenshots-and-video.md`) are linked from `contributors/index.md`.
- [ ] `getting-started.md` renders the two promo videos.
- [ ] `npm run build` passes; no broken-link warnings.
- [ ] A non-technical reader can find their own role guide from `/docs/getting-started` within three clicks.

---

## Files to Modify / Create

### Create (counts)

- 1 user-docs landing: `users/index.md`
- 1 public-form guide: `users/public-registration.md`
- 1 admin index: `users/admin/index.md`
- 5 admin role hubs: `users/admin/{full-admin,registrations-admin,content-editor,app-log-viewer,users-admin}.md`
- 21 surface pages: `users/surfaces/<surface>.md`
- 3 sidebar categories: `users/_category_.json`, `users/admin/_category_.json`, `users/surfaces/_category_.json`
- 2 contributor guides: `contributors/writing-user-docs.md`, `contributors/screenshots-and-video.md`
- 38 copied media assets: 36 PNG + 2 MP4 in `website/static/img/screenshots/` and `website/static/img/promo/`

### Modify

- `website/docs/getting-started.md` — twice (Phase 1: videos + nav; Phase 6: final polish)
- `website/docs/index.md` — Phase 6: redirect/expand to users landing
- `website/docs/contributors/index.md` — link the two new guides
- `website/docs/contributors/postgres-roles.md` — cross-link to role hubs
- `website/docs/contributors/testing-dummy-login.md` — cross-link to role hubs

---

## Implementation Notes

- **Phase ordering rationale**: Phase 1 (template proof) before Phase 2 (style guide) is deliberate — the guide captures patterns chosen by the worked example, not theoretical ideals. Phase 3 (scaffolding) before Phase 4 (surface fill) lets contributors see the full sidebar early so the structure is committed before any deep prose work.
- **Single PR, multiple commits**: phases land as separate commits on the same branch (`docs/user-documentation`) for readable git history. The final merge is one PR.
- **Screenshots are immutable assets**: phases 1, 3 copy PNGs to `static/img/`. Source-of-truth remains `doc/screenshots/`; the static copy is generated. Phase 2's `screenshots-and-video.md` documents how to refresh both locations.
- **No new code**, only docs and asset copies.
- **`npm run smoke:admin` is not affected** — these changes don't touch the Next.js app code path.
- **Promo video file size**: each MP4 is several MB. Acceptable for a static site; Docusaurus serves them directly.