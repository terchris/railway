# Feature: Proper homepage + GitHub Pages deployment

> **IMPLEMENTATION RULES:** Before implementing this plan, read and follow:
> - [WORKFLOW.md](../../WORKFLOW.md) - The implementation process
> - [PLANS.md](../../PLANS.md) - Plan structure and best practices

## Status: Completed

**Goal**: Ship the Docusaurus site to GitHub Pages at `https://railway.sovereignsky.no`, then replace the redirect-only `/` page with a real homepage (Option A from the investigation: hero + three audience cards). Two phases, one PR at the end.

**Last Updated**: 2026-05-19
**Completed**: 2026-05-19

**Investigation**: [INVESTIGATE-homepage-and-gh-pages.md](../backlog/INVESTIGATE-homepage-and-gh-pages.md)

---

## Overview

Locked-in decisions from the investigation (maintainer answered 2026-05-19):

| # | Question | Decision |
|---|---|---|
| Q1 | GitHub Pages source | **GitHub Actions** (urbalurba pattern, no `gh-pages` branch) |
| Q2 | Homepage scope | **Option A — Minimal**: hero (title + tagline + 3 CTAs) + 3 audience cards |
| Q3 | Promo video on hero | **No** — keep videos on `/docs/getting-started` only |
| Q4 | `onBrokenLinks` | **Relax to `'warn'`** (match urbalurba; strict has served the docs work, but the maintainer wants the site to deploy even when a stray link breaks) |
| Q5 | Workflow trigger paths | **Same as urbalurba** — `website/**` and `.github/workflows/docs.yml` |
| Q6 | DNS CNAME | **Already configured** by maintainer; this PLAN adds the repo-side `static/CNAME` file only |

Two sequential phases:

1. **Phase 1 — Config + CNAME + workflow.** Pure infrastructure. Updates `docusaurus.config.ts`, adds `website/static/CNAME`, adds `.github/workflows/docs.yml`. The existing `<Redirect to="/docs/" />` is unchanged — the public URL goes live forwarding to `/docs/`. This is the natural rollback point: if Phase 2 has issues, Phase 1 alone is shippable.
2. **Phase 2 — Homepage v1 (Option A).** Replaces the redirect with hero (title + tagline + 3 CTA buttons) and a 3-card audience grid below. Reuses copy from `getting-started.md`. No new visual assets needed.

One branch (`docs/homepage-and-gh-pages`), one PR at the end of Phase 2.

---

## Phase 1: Config + CNAME + workflow — DONE

Pure infrastructure. After this phase the site is reachable at `https://railway.sovereignsky.no` and immediately redirects to `/docs/`, exactly as it does on `localhost:3011` today.

### Tasks

- [x] 1.1 Updated `website/docusaurus.config.ts`: url, tagline, organizationName/projectName env-driven, trailingSlash:false, onBrokenLinks:'warn'.
- [x] 1.2 Created `website/static/CNAME` containing `railway.sovereignsky.no`.
- [x] 1.3 Created `.github/workflows/docs.yml` with the urbalurba Actions-as-source pattern (build + deploy, Node 20, GITHUB_ORG/GITHUB_REPO env).
- [x] 1.4 Smoke-tested local build — `build/CNAME` contains `railway.sovereignsky.no`. Build emits 4 broken-link warnings inherited from PR #7 (pre-existing); recorded as follow-up.
- [x] 1.5 Maintainer reminder in PR description: enable **Settings → Pages → Source: "GitHub Actions"** before first deploy.

### Validation

```bash
cd website && npm run build
ls build/CNAME && cat build/CNAME
```

- Build passes with no errors (warnings allowed since we relaxed `onBrokenLinks`).
- `build/CNAME` contains exactly `railway.sovereignsky.no`.
- User confirms phase is complete before moving to Phase 2.

The first push to `main` (or the merged PR) will trigger the workflow. The maintainer watches the Actions tab; first deploy can take 1-2 min after the action completes for Pages to propagate. Visiting `https://railway.sovereignsky.no` should redirect to `/docs/`.

---

## Phase 2: Homepage v1 — Option A (hero + 3 audience cards) — DONE

Replace the redirect with the minimal homepage. Hero on top, three audience cards below. Reuses the copy already in `getting-started.md` so there's no new prose to author or translate.

### Tasks

- [x] 2.1 Replaced `website/src/pages/index.tsx` with hero + AudienceGrid layout — title, tagline, 3 CTA buttons, 3 audience cards (Frivillig / Stab / Utvikler) using built-in `.card` classes.
- [x] 2.2 Created `website/src/pages/index.module.css` — hero padding, button row, audience-grid breakpoints, card hover lift. No theme overrides; Docusaurus' light/dark handles itself.
- [x] 2.3 Built + served locally; hero renders with all 7 expected strings (title, tagline, 3 CTAs, 3 card headings, section heading).
- [x] 2.4 Verified all 4 destinations (`/`, `/docs/users/public-registration`, `/docs/users/admin`, `/docs/contributors`) return 200.
- [x] 2.5 PR description includes the "enable Pages → Source: GitHub Actions" reminder.
- [ ] 2.6 (post-merge) Watch first Actions run, confirm `https://railway.sovereignsky.no` serves the new homepage.

### Validation

```bash
cd website && npm run build && npm run start -- --port 3011
# Visit http://localhost:3011/ — verify hero, tagline, 3 CTA buttons, 3 audience cards
# Click each link, verify it lands on the right doc page
```

User confirms:
- Hero shows title "Railway", tagline "Frivilligregistrering for Oslo Røde Kors", three CTA buttons.
- Three audience cards (Frivillig / Stab / Utvikler) render below the hero in a row on desktop, stacked on mobile.
- All six clickable destinations resolve.
- Production URL `https://railway.sovereignsky.no` shows the same homepage after the workflow deploys.

---

## Acceptance Criteria

- [ ] `https://railway.sovereignsky.no` resolves and serves the new homepage (not the placeholder redirect).
- [ ] Hero shows correct title + tagline + three CTAs going to public-registration, admin, contributors.
- [ ] Three audience cards mirror `getting-started.md`'s table.
- [ ] GitHub Actions workflow runs on every push to `main` that touches `website/**`.
- [ ] `website/build/CNAME` is present after build.
- [ ] No broken-link errors on build (warnings allowed since we relaxed `onBrokenLinks`).
- [ ] `getting-started.md` is unchanged (both promo videos still live there; the homepage does not duplicate them).
- [ ] PR description tells the maintainer to enable Pages → Source: "GitHub Actions" in repo settings.

---

## Implementation Notes

### MDX/TSX gotchas

- `website/src/pages/index.tsx` is **TSX**, not MDX — no JSX-tag-parsing trap with `<role>` etc. The MDX rules that bit us in the docs work do not apply here.
- The repo-root `tsconfig.json` already excludes `website/` (added during the user-docs phase), so the homepage's `JSX.Element` types don't leak into the Next app's type-check.

### Workflow file location

`.github/` does not exist in this repo yet. The Write tool will create `.github/workflows/docs.yml` and the parent directories automatically. No need to `mkdir -p` first.

### CNAME file content

Plain text, no quoting:

```
railway.sovereignsky.no
```

GitHub's Pages serving layer reads this from the deployed artifact root and sets the custom domain. The DNS-side CNAME (already configured by maintainer) points the subdomain at `terchris.github.io`.

### Why two phases, one PR

Phase 1 is a safe, narrow change (config + one workflow file + one CNAME) that ships the deployment plumbing. Phase 2 swaps the actual homepage. We do them in one PR because Phase 1 alone produces a public URL that redirects-to-docs (functionally identical to `localhost:3011` today), and there's no review-cost reason to ship that as a standalone PR. But internally we keep the phase boundary so the commits are clean: if Phase 2 needs rework, Phase 1's commits stand alone.

If Phase 2 reveals unexpected complexity (e.g., a missing CSS variable, an icon library we want), split into two PRs at PR-creation time. Default is single PR.

### Local default for organizationName/projectName

`organizationName: process.env.GITHUB_ORG || 'terchris'` — the default fires for local builds (`npm run build` without env vars). CI overrides it with the real GitHub org. Avoids hardcoding the org name in two places.

### Why relax `onBrokenLinks`

The user-docs work used `'throw'` to catch breakage early, which served us well. The maintainer's preference now is to keep deploys robust against stray broken links (a missed surface-page rename shouldn't block a deploy to a public URL). Phase 1 of this PLAN is the cleanest moment to make the switch since the deployment workflow goes in at the same time. If a later PR introduces broken links, the deploy still succeeds but the build log shows warnings.

---

## Files to Modify

- `website/docusaurus.config.ts` (update url, tagline, organizationName, projectName, trailingSlash, onBrokenLinks)
- `website/src/pages/index.tsx` (replace redirect with hero + cards layout)

## Files to Add

- `website/static/CNAME`
- `website/src/pages/index.module.css`
- `.github/workflows/docs.yml`

## Files to Move (after completion)

- `INVESTIGATE-homepage-and-gh-pages.md` → `plans/completed/`
- `PLAN-homepage-and-gh-pages.md` → `plans/completed/`
- Update `plans/backlog/index.md` (remove rows) and `plans/completed/index.md` (add rows)
