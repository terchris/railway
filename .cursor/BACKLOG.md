# Railway admin & parity backlog

Derived from `terchris/new/07-admin-app.md`, `06-public-form.md`, and `terchris/cursor-comments/01-validation-review.md` (railway-main). This file tracks **helpers/railway** only.

**Legend:** P0 = foundation · P1 = high value next · P2 = fuller CP parity · Done = landed in repo

---

## Done

- [x] **P1** Public wizard: payload, steps, persistence, honeypot, `submit_registration`, activity limit split (primary/additional).
- [x] **P1** Admin cookie login (placeholder for real staff auth).
- [x] **P1** Staff PostgREST JWT (`POSTGREST_ADMIN_JWT` / `POSTGREST_STAFF_JWT_UIS`).
- [x] **P1** Registrations list (read).
- [x] **P1** Activities: grouped list + `is_enabled` toggle (`content:write`).
- [x] **P1** Activity categories tabell med **rekkefølge** (`/admin/activity-categories`).
- [x] **P1** `activity_settings` singleton edit (selection limit).
- [x] **P2** Partial `text_content`: activity-step copy (`/admin/activities-text`; full liste på `/admin/text-content`).
- [x] **P2** Hard **bulk‑ / enkelt‑slett** registreringer + liste‑filtre **`older_than`**, **`has_activity`** + `window.confirm`; CSV eksport samme filter.
- [x] **P1** `npm run smoke:admin` script.

---

## In progress / this sprint

_(neste: Postgres/RPC-paritet eller optimistisk UI for toggler — se backlog.)_

---

## Completed this sprint (2026-05-12)

- [x] **Teknisk gjeld** Strammere **CSRF/origin** på `POST /api/registrations`: ekte origin‑treff + valgfri `Sec-Fetch-Site`‑sperre; komma‑liste i `PRIMARY_SITE_URL`.
- [x] **P2** **`JWT_SECRET`**‑verifisert admin‑økt (HTTP‑only cookie med HS256 staff‑JWT); **`ADMIN_COOKIE_SECRET`** fjernet; valgfritt **`ADMIN_PASSWORD`** bootstrap; **`npm run smoke:admin`** sender **`staffJwt`**.

- [x] **P1** Dashboard: **alert count** (`app_log_alert_count`) + lenke til `/api/health`.
- [x] **P1** Registration **detail** `/admin/registrations/[id]` + **`is_confirmed`** (checkbox + server action).
- [x] **P1** Registrations list: **filter** `?confirmed=true|false` + lenke til detalj fra ID.
- [x] **P2** Detalj: **Kopier** e‑post og telefon.
- [x] **P1** Registreringer: **paginering** `?page=`, rad-**bekreftet**, **CSV-eksport**; aktiviteter **ny/rediger**; **alle skjematekster** `/admin/text-content`; header-lenke.
- [x] **P1** Aktivitetskategorier: **rekkjefølge** (Opp/Ned) med sekvensiell PATCH.
- [x] **P2** Registreringer: bulk‑filtre **`older_than` / `has_activity`**, kryssvalg‑slett på side, slett på detalj.
- [x] **P2** Utskrift **`/admin/print/manuscript`** + **`/admin/print/form`** (skjermskontroll + `@media print`).
- [x] **P2** Skjemadata: **`/admin/skemadata`**, språk/medlemskap/ingen‑aktivitet/evalueringstabeller (liste, flytt, aktiv, rediger).
- [x] **P2** **`/admin/additional-activities`** — kun «tillegg»-kategorier (filtret aktivitetsliste).
- [x] **P2** **`/admin/app-log`** — liste, paginering, filter (type / åpne varsler), kvitt varsel (`app_log:write`).
- [x] **P2** Admin **sidebar** med JWT‑kapabiliteter + **`/admin/staff`** + **`Tilleggsaktiviteter`** i navigasjon.

---

## P1 — Next (admin usability)

- [x] Registrations **pagination** (URL `?page=` · 50 rader per side).
- [x] **Inline** confirmed toggle **on list row** (server action).
- [x] **CSV export** `GET /admin/registrations/export` (valgfritt `?confirmed=true|false`; UTF‑8 BOM).
- [x] Activities: **create/edit** `/admin/activities/new`, `/admin/activities/[id]` (PATCH alle feltene i UI).
- [x] Categories: **reorder** (Opp/Ned + sequential PATCH på `sort_order`; ingen RPC ennå).
- [x] **Full `text_content` editor** `/admin/text-content` (grupperte felter).

---

## P2 — CP-class parity

- [x] **Bulk delete** + filter params (`older_than`, `has_activity`) + confirmations (`window.confirm` per operasjon; ikke full **`07`** § D5 dialog‑stack).
- [x] **Print** manuscript + paper form routes.
- [x] **`/admin/languages`**, **`/admin/membership-statuses`**, **`/admin/membership-options`**, **`/admin/no-selected-options`**, **`/admin/evaluation/*`** (+ hub **`/admin/skemadata`**).
- [x] **`/admin/additional-activities`** or equivalent filtered view (may stay merged).
- [x] **Staff users** (`auth.users`, invites, reset) + capability-gated **sidebar** (`07` layout) — **MVP**: JWT‑kapabiliteter styrt sidebar + **`/admin/staff`** («Mine tilganger»); **`auth`**‑CRUD i app krever PostgREST‑eksponering eller DB‑tilkobling (UIS i dag).
- [x] Replace **`ADMIN_PASSWORD`** with real **session/JWT** login (`08-auth`) — **done**: økt‑cookie er HS256 staff‑JWT (`JWT_SECRET`); **`ADMIN_PASSWORD`** kun valgfritt dev‑bootstrap som mint lokalt (fjern i prod).

---

## Technical debt / analysis follow-ups

- [x] **CSRF / origin**: `PRIMARY_SITE_URL` som komma‑liste med URL‑origin‑match (ikke `startsWith`) + standard avvisning av `Sec-Fetch-Site: cross-site` (slakk med `REGISTRATION_RELAX_FETCH_METADATA=1`).
- [ ] **Postgres/RPC parity** from `01-validation-review` (disabled ids, eval empties, etc.) — verify in UIS DB, not only Next.
- [ ] **Optimistic UI** for toggles (`07`).

---

*Update this file when items ship or priorities change.*
