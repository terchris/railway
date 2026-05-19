---
sidebar_position: 1
---

# Contributors

Welcome! Railway is the volunteer registration front-end and admin for Oslo Røde Kors, packaged for [UIS](https://uis.sovereignsky.no/). This guide explains how to set up the project locally and how to contribute changes back.

## Ways to Contribute

| Contribution | Description | Start here |
|-------------|-------------|------------|
| **Fix bugs** | Resolve issues in the Next.js app or admin surfaces | [Getting Started](getting-started.md), then open a PR |
| **Add features** | Build new pages, admin tools, or API integrations | Read [Project Conventions](project-conventions.md) first |
| **Improve docs** | Fix errors, add examples, clarify instructions | See [Documentation](documentation.md) |
| **File issues** | Report bugs or suggest improvements | Open an issue in the repo |

## Quick Start

```bash
# 1. Clone the repository
git clone <repo-url>
cd railway

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env and set POSTGREST_URL / POSTGREST_ANON_JWT

# 4. Run the dev server
npm run dev   # http://localhost:3010

# 5. Sanity checks before committing
npm run lint
npm run build
```

## Guides

- [Getting Started](getting-started.md) — local development setup, environment variables, ports
- [Project Conventions](project-conventions.md) — hard rules (PostgREST-only data access) and Next.js gotchas
- [PostgreSQL roles](postgres-roles.md) — the four DB roles (`railway_owner`, `anon`, `authenticated`, `authenticator`) and how PostgREST uses them
- [Testing the dummy login picker](testing-dummy-login.md) — per-role test checklist for `/admin/login`
- [Documentation](documentation.md) — how to add or edit docs on this site
- [Writing user docs](writing-user-docs.md) — style guide for the Norwegian user-doc tree under `users/`
- [Screenshots and video](screenshots-and-video.md) — how to capture and refresh the PNGs + promo MP4s

## Before You Submit a Pull Request

- Run `npm run lint` and `npm run build` locally — both must pass
- Keep changes scoped — separate refactors from feature work
- For data access changes, re-read [Project Conventions](project-conventions.md#postgrest-only-data-access) — this is a hard rule
- Update or add docs under `website/docs/` if behaviour changes
