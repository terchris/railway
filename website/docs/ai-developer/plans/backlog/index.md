---
title: Backlog
sidebar_position: 1
---

# Backlog

Investigations and plans waiting for implementation, sorted by last updated date.

| Document | Goal | Updated |
|----------|------|---------|
| [Plan: User documentation, one section per role](PLAN-user-documentation.md) | Author the user-facing documentation tree under `website/docs/users/` (hybrid per-role-hub + per-surface-page IA), in Norwegian, with the 36 screenshots + 2 promo MP4s embedded. Adds two contributor companion guides (writing style + screenshot automation). One PR, six sequential phases. | 2026-05-19 |
| [Investigate: User documentation, one section per role](INVESTIGATE-user-documentation.md) | Plan the user-facing documentation tree on the Docusaurus site, organised by the roles the dummy-login picker exposes, using the 36 existing screenshots under `doc/screenshots/`. Open questions answered 2026-05-19; PLAN drafted above. | 2026-05-19 |
| [Investigate: `app_log_alert_count` RPC denies EXECUTE for `authenticated`](INVESTIGATE-app-log-alert-count-permission.md) | Decide whether the admin Oversikt should call this anon-only RPC, and if yes which of four DDL/code options to take. Surfaced by Tailway's browser test of the dummy login picker. | 2026-05-19 |
| [Investigate: PostgREST admin connection (UIS staff JWT delivery)](INVESTIGATE-postgrest-admin-connection.md) | Decide whether the original "can't reach UIS-local PostgREST as staff" problem is fully resolved by the UIS handoff in `talk/talk.md`, and what (if anything) to change in token-resolution precedence and docs. | 2026-05-18 |
