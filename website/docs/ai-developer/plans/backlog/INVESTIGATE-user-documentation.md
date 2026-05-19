# Investigate: User documentation, one section per role

> **IMPLEMENTATION RULES:** Before implementing this plan, read and follow:
> - [WORKFLOW.md](../../WORKFLOW.md) - The implementation process
> - [PLANS.md](../../PLANS.md) - Plan structure and best practices

## Status: Backlog

**Goal**: Plan the user-facing documentation tree on the Docusaurus site, organised by the roles the dummy-login picker exposes, using the 36 existing screenshots under `doc/screenshots/`. Establish the information architecture, the per-role page template, the screenshot mapping, and what's left to author — before writing any of the actual docs.

**Last Updated**: 2026-05-19

---

## Background

Railway has two distinct user populations:

1. **Public visitors** — volunteers using the registration form (one wizard, no login).
2. **Staff / admin** — people logging into `/admin` with a JWT carrying one or more capabilities from the 9-cap auth model (`admin`, `registrations:read/write`, `content:read/write`, `app_log:read/write`, `users:read/write`).

The dummy login picker ([PLAN-dummy-login.md](../completed/PLAN-dummy-login.md)) groups the staff side into five capability profiles plus `anon`. These same groupings naturally map to "kinds of user the docs serve":

| User the docs serve | Login profile (today) | What they see |
|---|---|---|
| Public registrant | `anon` | The wizard at `/`, thank-you pages |
| Full admin | `authenticated_full_admin` (`admin` cap) | Every admin surface |
| Registrations admin | `authenticated_registrations` | `/admin`, `/admin/registrations*`, `/admin/staff` |
| Content editor | `authenticated_content` | `/admin`, content/activities/eval/language/text-content, `/admin/print/*`, `/admin/staff` |
| App-log viewer | `authenticated_applog` | `/admin`, `/admin/app-log`, `/admin/staff` |
| Users admin | `authenticated_users` | `/admin`, `/admin/staff` (no surfaces with users:* gating today) |

The 36 screenshots in `doc/screenshots/` cover both populations (7 public + 29 admin). They were captured by `npm run docs:screens` (Playwright) and rebuilt into two MP4s by `npm run video:promo`. Today they're orphaned — no doc page references them.

The user has explicitly named **`/docs/getting-started`** (the page at `website/docs/getting-started.md`) as the place to plan and eventually anchor this work. That page currently holds placeholder text.

---

## Questions to Answer

1. **Organisation axis** — per role, per surface, or hybrid?
2. **File tree** — where exactly do the user docs live? What does the sidebar look like?
3. **Language** — Norwegian (matches the admin UI strings) or English (matches the rest of the Docusaurus site)? Or bilingual?
4. **Per-role page template** — what sections does every role guide have, in what order?
5. **Screenshot mapping** — which screenshots go in which guide? Are there gaps?
6. **Relationship to `/docs/getting-started`** — is it a hub, a redirect, an overview, or a single user's onboarding flow?
7. **Scope of the first delivery** — all six audiences at once, or one to prove the template, then the rest?

---

## Current state

### Existing files in `website/docs/`

```
docs/
├── index.md                     # placeholder "Railway"
├── getting-started.md           # placeholder "Replace with real content"
├── ai-developer/                # AI-coding-assistant guides + plans
│   ├── README.md, WORKFLOW.md, PLANS.md, GIT.md, TALK.md
│   └── plans/{backlog,active,completed,talk}/
└── contributors/                # contributor-developer guides
    ├── index.md, getting-started.md, project-conventions.md,
    ├── postgres-roles.md, testing-dummy-login.md, documentation.md
    └── _category_.json
```

There is no `users/` tree yet. The site has two audiences served today (AI agents + contributing developers) and is missing the third (end users).

### Existing screenshot inventory

**Public surface (7 files):**

| File | Surface |
|---|---|
| `rwg-pub-home.png` | `/` — wizard intro / landing |
| `rwg-pub-wizard-intro.png` | First wizard step |
| `rwg-pub-wizard-about.png` | About / personal info step |
| `rwg-pub-wizard-activities.png` | Activity selection step |
| `rwg-pub-wizard-confirmation.png` | Review step |
| `rwg-pub-thank-you.png` | Confirmation page (volunteer) |
| `rwg-pub-thank-you-membership.png` | Confirmation page (member) |

**Admin surface (29 files):**

| Group | Files |
|---|---|
| Auth + identity | `rwg-adm-login`, `rwg-adm-staff` |
| Dashboard | `rwg-adm-overview` |
| Registrations | `rwg-adm-registrations`, `rwg-adm-registration-detail` |
| Activities | `rwg-adm-activities`, `rwg-adm-activities-new`, `rwg-adm-activity-detail`, `rwg-adm-activity-categories`, `rwg-adm-activity-settings`, `rwg-adm-additional-activities`, `rwg-adm-activities-text` |
| Evaluation | `rwg-adm-eval-questions`, `rwg-adm-eval-question-detail`, `rwg-adm-eval-options`, `rwg-adm-eval-option-detail` |
| Membership | `rwg-adm-membership-options`, `rwg-adm-membership-option-detail`, `rwg-adm-membership-statuses`, `rwg-adm-membership-status-detail` |
| No-selected options | `rwg-adm-no-selected-options`, `rwg-adm-no-selected-option-detail` |
| Languages | `rwg-adm-languages`, `rwg-adm-language-detail` |
| Text content | `rwg-adm-text-content`, `rwg-adm-skemadata` |
| Print | `rwg-adm-print-form`, `rwg-adm-print-manuscript` |
| Drift | `rwg-adm-app-log` |

**Promo videos (2 files, would be embeddable later):**
`railway-promo-1920-wide.mp4`, `railway-promo-1080x1920-vertical.mp4`.

### Screenshot ↔ login-profile coverage

| Login profile | Sidebar groups visible | Surfaces with screenshots | Coverage |
|---|---|---|---|
| Anon (public) | (no admin) | All 7 public surfaces | **Complete** |
| Full admin | Oversikt, Registreringer, Utskrift, Aktivitet og skjema, Drift, Konto | All 29 admin surfaces | **Complete** |
| Registrations admin | Oversikt, Registreringer, Konto | overview, registrations, registration-detail, staff | Complete for the visible surfaces |
| Content editor | Oversikt, Utskrift, Aktivitet og skjema, Konto | overview, activities*, eval*, languages*, membership*, no-selected*, text-content, skemadata, additional-activities, activities-text, activity-settings, print-form, print-manuscript, staff | Complete |
| App-log viewer | Oversikt, Drift, Konto | overview, app-log, staff | Complete |
| Users admin | Oversikt, Konto | overview, staff | Complete (no users-cap surfaces exist) |

**No screenshot gaps for any role.** Whatever sidebar groups a role sees, every linked surface has a captured PNG.

---

## Options

### Option A — Per-role pages only

`website/docs/users/<role>.md` — one file per audience. Each page describes login, what the role sees, what they can do, embedded screenshots.

**Pros:**
- Matches user mental model ("I'm the registrations admin, what's my job here?").
- One stop per role; user doesn't navigate.

**Cons:**
- Same surface (e.g. `/admin/registrations`) documented in multiple files if it appears for multiple roles (Full admin + Registrations admin both have it).
- Maintenance: when a surface changes, multiple role pages need updates.

### Option B — Per-surface pages only

One file per admin surface (`/admin/registrations`, `/admin/activities`, etc.) plus one for the public wizard. Roles are mentioned at the top of each page as "Who sees this".

**Pros:**
- Single source of truth per screen.
- Easy to add new surfaces.

**Cons:**
- User has to know the URL of the surface they care about to find the doc.
- Hides the role-based mental model ("what's my job") the dummy-login picker establishes.

### Option C — Hybrid: per-role hub + per-surface detail (Recommended)

`website/docs/users/<role>.md` is a **short hub** describing the role, login process, and an annotated list of the sidebar groups they see with one-paragraph descriptions and embedded thumbnail screenshots. Each list item links to a corresponding `website/docs/users/surfaces/<surface>.md` that holds the *actual* per-screen documentation (full-resolution screenshot, what the screen does, what to click, common tasks, gotchas).

**Pros:**
- One source of truth per surface (B's win).
- Role-first navigation (A's win) for users who know their role but not the URL.
- Adding a new surface: add one surface page; link from each role hub that gets it (a small touch in each).
- Per-role guides stay short and skim-friendly.

**Cons:**
- Two file trees to maintain (role hubs + surface pages).
- Need to define clearly what lives in the hub vs the surface page.

---

## Recommendation

**Option C — hybrid.** Concrete file tree:

```
website/docs/
├── index.md                                # site landing (audience selector)
├── getting-started.md                      # "I'm new here, what does Railway do?"
├── users/                                  # NEW — end-user docs
│   ├── _category_.json                     # sidebar label "User guides"
│   ├── index.md                            # audience landing: which guide are you?
│   ├── public-registration.md              # the wizard, full walkthrough
│   ├── admin/                              # admin guides
│   │   ├── _category_.json                 # sidebar label "Admin guides"
│   │   ├── index.md                        # which admin role are you?
│   │   ├── full-admin.md                   # role hub
│   │   ├── registrations-admin.md          # role hub
│   │   ├── content-editor.md               # role hub
│   │   ├── app-log-viewer.md               # role hub
│   │   └── users-admin.md                  # role hub
│   └── surfaces/                           # per-screen detail pages
│       ├── _category_.json                 # sidebar label "Surface reference"
│       ├── overview.md                     # /admin
│       ├── login.md                        # /admin/login
│       ├── staff.md                        # /admin/staff
│       ├── registrations.md                # /admin/registrations + detail
│       ├── registrations-export.md         # /admin/registrations/export
│       ├── activities.md                   # /admin/activities + detail + new
│       ├── activity-categories.md
│       ├── activity-settings.md
│       ├── additional-activities.md
│       ├── activities-text.md
│       ├── text-content.md
│       ├── skemadata.md
│       ├── eval-questions.md               # questions + question-detail
│       ├── eval-options.md                 # options + option-detail
│       ├── membership-options.md           # + detail
│       ├── membership-statuses.md          # + detail
│       ├── no-selected-options.md          # + detail
│       ├── languages.md                    # + detail
│       ├── print-manuscript.md
│       ├── print-form.md
│       └── app-log.md
├── ai-developer/                           # unchanged
└── contributors/                           # unchanged
```

`/docs/getting-started` (the page the user named) becomes the **end-user onboarding entry point** — a short page that explains what Railway is, who the audience for the user docs is, and links into `users/`. Not the placeholder it is today.

### Per-role hub page template

Every file under `users/admin/<role>.md` follows this skeleton:

```markdown
---
sidebar_position: <n>
---

# [Role label] — [one-sentence job description]

## Logging in

Open `http://<host>/admin/login`. In the picker, click **[Role label]**.

(Screenshot of `/admin/login` with the picker; the relevant row highlighted.)

You land on `/admin`. The sidebar shows: **[group list]**.

## What you can do

For each sidebar group the role sees, a one-paragraph description with
a thumbnail screenshot and a link to the surface page.

### Oversikt
Brief description. [→ Detail](../surfaces/overview.md)

### Registreringer
Brief description. [→ Detail](../surfaces/registrations.md)

…

## What you cannot do

A short note for each capability the role lacks — "you cannot read
content because your token doesn't carry `content:read`. Switch to
the Content editor profile if you need that work."

## Related

- [Logging in](../surfaces/login.md)
- [Mine tilganger](../surfaces/staff.md) — how to inspect your own JWT
```

### Per-surface page template

Every file under `users/surfaces/<surface>.md`:

```markdown
---
sidebar_position: <n>
---

# [Surface name] — `/admin/<path>`

**Who sees this:** Full admin, [role list]
**Capability required:** `<cap-string>`

(Full-resolution screenshot)

## What this screen does

Short paragraph: the screen's purpose in one sentence, who's expected
to use it, when in the volunteer-registration lifecycle.

## What you'll see

Describe the columns, the filter, the buttons. Reference UI labels
verbatim (in their actual language — Norwegian today).

## Common tasks

- **[Task 1]**: numbered steps. Screenshot of the result if helpful.
- **[Task 2]**: …

## Gotchas

Anything surprising, like RLS-driven empty states for users without
the right cap, validation quirks, or known bugs.

## Related

- Role hubs that link here
- Related surface pages
```

### Language decision

**Recommend Norwegian.** Reasoning:

- The admin UI strings, error messages, sidebar labels, button text are all in Norwegian. A user-doc walkthrough in English would force every reader to mentally translate every UI quote.
- The contributing-developer docs are in English because they discuss code; English is the working language of the codebase. That's a different audience.
- Public-form documentation is naturally in Norwegian — the volunteers are Norwegian.

The site title, navbar, and code-facing docs stay English. User docs under `users/` are Norwegian. This matches the language each audience already encounters in the product.

**Open**: if a partner organisation needs English user docs in the future, the Docusaurus i18n plugin handles per-tree translation cleanly. Out of scope for the first delivery.

### Scope of the first delivery (recommended order)

1. **Phase 1 — Template proof**: build the `public-registration.md` user guide end-to-end (it's the most self-contained: 7 screenshots, no roles, no caps, one wizard).
2. **Phase 2 — Admin scaffolding**: `users/index.md`, `users/admin/index.md`, the 5 role hubs as stubs, all 21 surface pages as stubs (frontmatter + screenshot + one-line description; "Common tasks" and "Gotchas" deliberately blank).
3. **Phase 3 — Surface fill**: write the 21 surface pages, top-down by audience size (Registrations and Full-admin surfaces first since they cover most contributors' use cases).
4. **Phase 4 — Role hub fill**: write the 5 role hubs once the surface pages they link to exist.
5. **Phase 5 — Cross-linking and polish**: update `getting-started.md` to become the user-doc hub; cross-link from `postgres-roles.md` and `testing-dummy-login.md` (those docs name the same roles).

Phases 1-2 are cheap and unblock a designer / future-user to start reading. Phases 3-4 are the bulk of the writing.

---

## Open Questions for the Maintainer — Answered 2026-05-19

1. **Language → Norwegian for `users/` content.** Matches admin UI strings and the volunteer audience. Code-facing docs (`ai-developer/`, `contributors/`) stay English.
2. **Tone → End-user-friendly.** Explicit "what to click" steps, prose aimed at someone who's never seen the product. Technical spec stays in `terchris/new/`; internals stay in `contributors/`.
3. **Per-role split → Yes, hybrid Option C.** Per-role hub + per-surface detail, for maintenance reasons (one source of truth per surface).
4. **Promo videos → Embed.** Both the wide and vertical MP4s go in `getting-started.md` as intro material. Docusaurus handles `<video>` natively.
5. **PLAN scope → One PR, many phases.** Single PLAN with sequential phases, but only one PR at the end. No mid-implementation merges.
6. **NEW — Contributor docs for the doc system itself**:
   - **6a**: `contributors/writing-user-docs.md` — style guide for the user docs (Norwegian voice, role-hub vs surface-page template, screenshot embedding conventions, what content goes where). Lives alongside the existing `documentation.md` which covers the Docusaurus site mechanics.
   - **6b**: `contributors/screenshots-and-video.md` — automation walkthrough: how `npm run docs:screens` (Playwright capture into `doc/screenshots/`) and `npm run video:promo` (ffmpeg merge to MP4) work, what env they need, how to add a new surface to the capture list, how to regenerate when the UI changes. Documents the existing scripts under `scripts/capture-screen-docs.mjs` and `scripts/build-promo-video.mjs`.

---

## Next Steps

- [x] Maintainer answers open questions. → Captured above.
- [ ] Draft `PLAN-user-documentation.md` in `plans/backlog/` covering all phases (single PR scope).
- [ ] On `start implementation`, move PLAN to active, create branch, work through phases.

---

## References

- `doc/screenshots/` — 36 PNG + 2 MP4 sources (`README.md` documents the naming)
- `scripts/capture-screen-docs.mjs` — regenerator (`npm run docs:screens`)
- `scripts/build-promo-video.mjs` — video build (`npm run video:promo`)
- [`postgres-roles.md`](../../../contributors/postgres-roles.md) — DB role model
- [`testing-dummy-login.md`](../../../contributors/testing-dummy-login.md) — per-role functional test spec (good companion for user docs)
- [`PLAN-dummy-login.md`](../completed/PLAN-dummy-login.md) — the picker that establishes the role-as-user-doc-audience mapping