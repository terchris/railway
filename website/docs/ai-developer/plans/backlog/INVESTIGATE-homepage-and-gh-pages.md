# Investigate: Proper homepage + GitHub Pages deployment

> **IMPLEMENTATION RULES:** Before implementing this plan, read and follow:
> - [WORKFLOW.md](../../WORKFLOW.md) - The implementation process
> - [PLANS.md](../../PLANS.md) - Plan structure and best practices

## Status: Backlog

**Goal**: Replace the redirect-only `/` page with a proper Docusaurus homepage and ship the site to GitHub Pages at **`https://railway.sovereignsky.no`**. The CNAME at the DNS provider is already configured by the maintainer.

**Last Updated**: 2026-05-19

---

## Background

Today `website/src/pages/index.tsx` is a one-line `<Redirect to="/docs/" />`. Visiting the site root bounces straight into the docs tree. That's fine while the site is in development, but for a public production URL it should land on a **real homepage** — a place to introduce Railway visually before sending readers deeper.

Separately, the site needs to actually be **deployed**. There is no `.github/workflows/` directory in this repo today, no CNAME file in the build output, and no GitHub Pages source configured. The maintainer has set up the DNS CNAME for `railway.sovereignsky.no`; the repo side needs to catch up.

The sibling project [`urbalurba-infrastructure`](https://github.com/helpers-no/urbalurba-infrastructure) has solved both problems and is online at `https://uis.sovereignsky.no`. This investigation uses it as the reference implementation.

---

## Current state (Railway)

### Homepage

`website/src/pages/index.tsx`:

```tsx
import {Redirect} from '@docusaurus/router';

export default function Home(): JSX.Element {
  return <Redirect to="/docs/" />;
}
```

No hero. No layout. No branding. The path `/` immediately becomes `/docs/`.

### Docusaurus config (relevant fields)

```ts
title: 'Railway',
tagline: 'Documentation',          // generic placeholder
url: 'https://railway.example.com', // placeholder, never resolved
baseUrl: '/',
onBrokenLinks: 'throw',
// no organizationName / projectName
// no GitHub-Pages-specific fields
```

### Deployment

- No `.github/` directory exists in the repo.
- No `website/static/CNAME` exists.
- DNS: maintainer reports `railway.sovereignsky.no` CNAME-record is already set (presumably pointing at `terchris.github.io`).
- GitHub repo settings → Pages: presumed not yet configured for "GitHub Actions" source (verify before/while running the workflow).

---

## Reference: how `urbalurba-infrastructure` does it

Four moving parts, all worth copying with adaptation.

### 1. Custom homepage — `website/src/pages/index.tsx`

```tsx
function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className={clsx('container', styles.heroContainer)}>
        <div className={styles.heroAnimation}>
          <FloatingCubes />
        </div>
        <div className={styles.heroContent}>
          <h1 className="hero__title">{siteConfig.title}</h1>
          <p className="hero__subtitle">{siteConfig.tagline}</p>
          <div className={styles.buttons}>
            <Link className="button button--lg button--primary"
                  to="/docs/getting-started/overview">Get Started</Link>
            <Link className="button button--lg button--secondary"
                  to="/docs/services/ai">Explore Services</Link>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  return (
    <Layout title={siteConfig.title}
            description="…">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
```

`HomepageFeatures` is a component that renders three sections (`<CategoryGrid>`, `<StackGrid>`, `<ServiceGrid>`) — each a per-card grid driven by a data file under `src/data/`.

Local CSS modules style the hero (`src/pages/index.module.css`) and the features block (`src/components/HomepageFeatures/styles.module.css`).

### 2. `docusaurus.config.ts` deployment fields

```ts
const GITHUB_ORG = process.env.GITHUB_ORG || 'helpers-no';
const GITHUB_REPO = process.env.GITHUB_REPO || 'urbalurba-infrastructure';

const config: Config = {
  url: 'https://uis.sovereignsky.no',
  baseUrl: '/',
  organizationName: GITHUB_ORG,
  projectName: GITHUB_REPO,
  trailingSlash: false,
  // …
};
```

The `GITHUB_ORG` / `GITHUB_REPO` defaults are overridden in CI from `${{ github.repository_owner }}` and `${{ github.event.repository.name }}`. Local builds inherit the defaults.

### 3. CNAME file — `website/static/CNAME`

Plain text, one line:

```
uis.sovereignsky.no
```

Docusaurus copies `static/` verbatim into `build/`, so the CNAME ends up at the root of the deployed artifact. GitHub Pages reads it to set the custom domain on the served site.

### 4. GitHub Actions workflow — `.github/workflows/docs.yml`

```yaml
name: Deploy Documentation
on:
  push:
    branches: [main]
    paths:
      - 'website/**'
      - '.github/workflows/docs.yml'
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: website/package-lock.json
      - run: npm ci
        working-directory: website
      - run: npm run build
        working-directory: website
        env:
          GITHUB_ORG: ${{ github.repository_owner }}
          GITHUB_REPO: ${{ github.event.repository.name }}
      - uses: actions/upload-pages-artifact@v3
        with:
          path: website/build

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

Pure GitHub-Actions-as-source path (no `gh-pages` branch). Repo settings → Pages → Source must be set to "GitHub Actions" once.

---

## What we need to build

| Piece | Path | Status today |
|---|---|---|
| Real `index.tsx` with hero + features | `website/src/pages/index.tsx` | Just a redirect |
| CSS module(s) for the homepage | `website/src/pages/index.module.css` + per-component | Missing |
| Optional feature components | `website/src/components/<X>/index.tsx` + CSS | Missing |
| Updated tagline / URL / org / project in config | `website/docusaurus.config.ts` | Placeholder values |
| CNAME for custom domain | `website/static/CNAME` (content: `railway.sovereignsky.no`) | Missing |
| GitHub Actions deployment workflow | `.github/workflows/docs.yml` | No `.github/` at all |
| Repo settings: Pages source = GitHub Actions | GitHub UI | Presumed not configured |

---

## Open questions for the maintainer

1. **GitHub Pages source mode**: Confirm the repo will use the **"GitHub Actions"** source (the urbalurba pattern), not the legacy `gh-pages` branch. The workflow above only works with Actions-as-source.
2. **Homepage scope** — three options, see §Options below.
3. **Promo video on the homepage**: embed the wide MP4 in the hero, or keep it on `/docs/getting-started` only? Hero video is heavier but more impactful.
4. **`onBrokenLinks` policy**: keep `'throw'` (current Railway setting, strict) or relax to `'warn'` (urbalurba's setting)? Strict has caught a number of real link breaks during the docs work — recommend keeping it.
5. **Workflow trigger paths**: copy urbalurba's `website/**` + the workflow file itself, or broaden to include the screenshot scripts so re-captures also rebuild? Recommend: same as urbalurba for v1; broaden later if screenshots get regenerated in CI.
6. **What does the maintainer's CNAME setup look like?** "Set up CNAME for railway.sovereignsky.no" — confirm this is a DNS-side CNAME record pointing at `terchris.github.io`, not a repo-side file. Repo CNAME file is what we add in this work.

---

## Options for the homepage scope

### Option A — Minimal: hero + 3 audience cards (Recommended for v1)

What lands:

- Hero with title (**"Railway"**), tagline (**"Frivilligregistrering for Oslo Røde Kors"**), and three CTA buttons → public form, admin, contributors.
- Below the fold: a simple 3-card grid mirroring the table in `getting-started.md` (Frivillig / Stab / Utvikler).
- Footer: Docusaurus default (already configured).

**Pros**: ships fast, leans on existing copy from `getting-started.md`, looks substantive without inventing visual assets.

**Cons**: visually plain; doesn't show the product before the click.

**Effort**: ~1-2 hours.

### Option B — Rich: hero + promo video + audience cards + screenshot gallery

Adds to Option A:

- Wide promo MP4 (autoplay-on-scroll-into-view) above the audience cards.
- 4-shot rotating screenshot strip showing the wizard, the admin overview, registrations, and app-log.

**Pros**: visitor sees the product immediately. Sells what Railway *is*.

**Cons**: more components to maintain, screenshot strip needs care (rotation, responsive sizes). Video file size is on every homepage hit (mitigate with `preload="metadata"`).

**Effort**: ~3-5 hours.

### Option C — Urbalurba pattern: hero + feature sections with grids

Adds to Option A:

- One grid section per major audience capability, similar to urbalurba's Categories / Stacks / Services.
- Possibly driven by data files (`src/data/audiences.ts`) so adding a new role on the picker auto-appears here.

**Pros**: most extensible. Best matches the sister-site visual identity.

**Cons**: most upfront work (~half day). Overkill if Railway's audience set stays at three.

**Effort**: ~half day to a day.

### Recommendation

**Option A** for v1. Ships in a single small commit, replaces the redirect, gives the production URL something to render before users go deeper. Option B and C remain on the table as follow-up PLANs once Option A is live and the maintainer has a feel for what's missing.

---

## GitHub Pages deployment — specific decisions

- **Workflow path**: `.github/workflows/docs.yml`. New file; this repo has no `.github/` directory yet, so the PLAN also needs to create the parent directory.
- **Workflow trigger**: `paths: ['website/**', '.github/workflows/docs.yml']` per urbalurba. `workflow_dispatch` keeps a manual trigger button in the Actions UI.
- **Node version**: 20 (matches urbalurba and the local dev setup).
- **Build env**: pass `GITHUB_ORG` and `GITHUB_REPO` so `docusaurus.config.ts` resolves dynamically. Avoids hardcoding `terchris/railway` in the config.
- **`docusaurus.config.ts` updates**:
  - `url: 'https://railway.sovereignsky.no'` (matches DNS + CNAME)
  - `tagline: 'Frivilligregistrering for Oslo Røde Kors'` (replace generic "Documentation")
  - `organizationName: process.env.GITHUB_ORG || 'terchris'` (default for local builds)
  - `projectName: process.env.GITHUB_REPO || 'railway'`
  - `trailingSlash: false`
- **CNAME**: `website/static/CNAME` containing exactly `railway.sovereignsky.no` (no newline at end is fine; one trailing newline also fine).
- **Repo settings**: maintainer enables Pages → Source → "GitHub Actions" once. Workflow won't deploy until this is set.
- **First deploy**: push to `main` triggers the workflow. Or run the workflow_dispatch button. Watch the run; first deploy can take 1-2 min after the action completes for Pages to propagate.
- **`onBrokenLinks`**: keep `'throw'`. Catches breakage at PR time rather than after merge.

---

## Recommended next-step PLAN

Once the open questions are answered, draft `PLAN-homepage-and-gh-pages.md` with phases:

1. **Phase 1 — Config + CNAME + workflow.** Pure infrastructure: update `docusaurus.config.ts`, add `static/CNAME`, add `.github/workflows/docs.yml`. No homepage change yet — the existing redirect still works at the public URL. Smoke test: workflow runs cleanly; site appears at `https://railway.sovereignsky.no` redirecting to `/docs/`.
2. **Phase 2 — Homepage v1 (Option A).** Replace the redirect with hero + 3 audience cards. Reuses copy from `getting-started.md` and screenshots from `/img/screenshots/`. Smoke test: visit `https://railway.sovereignsky.no`, see hero + cards.
3. **Phase 3 (optional, can be its own PLAN later)** — Promo video on hero (Option B addition) or feature grids (Option C).

Splitting phase 1 and phase 2 lets the deployment ship before the visual work and gives a clean rollback point.

---

## References

- Reference implementation: `learn/helpers/urbalurba-infrastructure/website/` (this machine)
- Live site: [uis.sovereignsky.no](https://uis.sovereignsky.no)
- `urbalurba-infrastructure/.github/workflows/docs.yml`
- `urbalurba-infrastructure/website/src/pages/index.tsx`
- `urbalurba-infrastructure/website/static/CNAME`
- Docusaurus deployment docs: [docusaurus.io/docs/deployment#deploying-to-github-pages](https://docusaurus.io/docs/deployment#deploying-to-github-pages)
- GitHub Pages with Actions: [docs.github.com publishing-with-a-custom-github-actions-workflow](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site#publishing-with-a-custom-github-actions-workflow)
