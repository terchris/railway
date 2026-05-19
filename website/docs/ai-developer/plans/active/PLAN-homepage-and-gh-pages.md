# Feature: Proper homepage + GitHub Pages deployment

> **IMPLEMENTATION RULES:** Before implementing this plan, read and follow:
> - [WORKFLOW.md](../../WORKFLOW.md) - The implementation process
> - [PLANS.md](../../PLANS.md) - Plan structure and best practices

## Status: Active

**Goal**: Ship the Docusaurus site to GitHub Pages at `https://railway.sovereignsky.no`, then replace the redirect-only `/` page with a real homepage (Option A from the investigation: hero + three audience cards). Two phases, one PR at the end.

**Last Updated**: 2026-05-19

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

## Phase 1: Config + CNAME + workflow

Pure infrastructure. After this phase the site is reachable at `https://railway.sovereignsky.no` and immediately redirects to `/docs/`, exactly as it does on `localhost:3011` today.

### Tasks

- [ ] 1.1 Update `website/docusaurus.config.ts`:
  - `url: 'https://railway.sovereignsky.no'` (replace placeholder)
  - `tagline: 'Frivilligregistrering for Oslo Røde Kors'` (replace generic "Documentation")
  - Add `organizationName: process.env.GITHUB_ORG || 'terchris'`
  - Add `projectName: process.env.GITHUB_REPO || 'railway'`
  - Add `trailingSlash: false`
  - Change `onBrokenLinks: 'throw'` → `onBrokenLinks: 'warn'`
- [ ] 1.2 Create `website/static/CNAME` with one line: `railway.sovereignsky.no` (single trailing newline OK).
- [ ] 1.3 Create `.github/workflows/docs.yml` with the urbalurba pattern: triggers on push to `main` for `website/**` and the workflow file itself, plus `workflow_dispatch`. Permissions `contents: read`, `pages: write`, `id-token: write`. Two jobs: `build` (checkout, setup-node@v4 Node 20 with npm cache keyed on `website/package-lock.json`, `npm ci` and `npm run build` in `website/` passing `GITHUB_ORG`/`GITHUB_REPO` env from `github.repository_owner`/`github.event.repository.name`, upload-pages-artifact@v3 with `path: website/build`) and `deploy` (deploy-pages@v4). Concurrency group `pages`, `cancel-in-progress: false`.
- [ ] 1.4 Smoke-test the build locally: `npm --prefix website run build`. Expect a clean build with one new line in the output mentioning `CNAME` being copied from `static/` to `build/`. Inspect `website/build/CNAME` — should contain `railway.sovereignsky.no`.
- [ ] 1.5 Pause for maintainer to enable Pages in GitHub repo settings (**Settings → Pages → Source: "GitHub Actions"**). This is a one-time UI step; the workflow won't deploy successfully until it's set. Document this in the PR description so it's not forgotten.

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

## Phase 2: Homepage v1 — Option A (hero + 3 audience cards)

Replace the redirect with the minimal homepage. Hero on top, three audience cards below. Reuses the copy already in `getting-started.md` so there's no new prose to author or translate.

### Tasks

- [ ] 2.1 Replace `website/src/pages/index.tsx` with the Option A layout:
  - Imports: `Layout` from `@theme/Layout`, `Link` from `@docusaurus/Link`, `useDocusaurusContext` from `@docusaurus/useDocusaurusContext`, `clsx`, and the local CSS module (created in 2.2).
  - `<Layout title={siteConfig.title} description="Frivilligregistrering for Oslo Røde Kors">` wraps everything.
  - Hero section: `<header className="hero hero--primary">`, container with `<h1 className="hero__title">Railway</h1>`, `<p className="hero__subtitle">{siteConfig.tagline}</p>`, and three CTA buttons in a `.buttons` flex row:
    - Primary: **"Meld deg på"** → `/docs/users/public-registration`
    - Secondary: **"Administrasjon"** → `/docs/users/admin/`
    - Secondary outline: **"Utvikler"** → `/docs/contributors/`
  - Main section: a 3-card grid (one row on desktop, stacked on mobile) using the same three audiences as `getting-started.md`. Each card has a heading (Frivillig / Stab / Utvikler), one-line description (reuse the table copy), and a "Les mer" link to the same destination as the CTA.
- [ ] 2.2 Create `website/src/pages/index.module.css` with three rules:
  - `.heroBanner` — padding (e.g. `4rem 2rem`), centered text, responsive `padding: 2rem` at the mobile breakpoint.
  - `.buttons` — flex row, `gap: 1rem`, `justify-content: center`, wraps on narrow screens.
  - `.audienceGrid` — CSS grid, `grid-template-columns: repeat(3, 1fr)` on desktop, `1fr` at the mobile breakpoint, `gap: 1.5rem`.
  - Card styling can lean on Docusaurus' built-in classes (`.card`, `.card__header`, `.card__body`) so we don't reinvent component styling.
- [ ] 2.3 Build locally and visit `http://localhost:3011/` to verify the hero + three cards render. Both light and dark mode should work without overrides (Docusaurus' `hero--primary` and card classes handle theming).
- [ ] 2.4 Test all three CTA links and all three card "Les mer" links — every one should resolve to an existing page (no 404s).
- [ ] 2.5 Open the PR. Body should include:
  - One-paragraph summary.
  - Note: **maintainer must enable Pages → Source: "GitHub Actions" in repo settings before the first deploy succeeds.**
  - Screenshot of the rendered homepage (optional but helpful).
- [ ] 2.6 After merge, watch the first Actions run complete. Visit `https://railway.sovereignsky.no` to confirm the homepage renders against the production URL.

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
