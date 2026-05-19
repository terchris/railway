# Investigate: Connect Railway activities to Oslo Røde Kors org-API activities

> **IMPLEMENTATION RULES:** Before implementing this plan, read and follow:
> - [WORKFLOW.md](../../WORKFLOW.md) - The implementation process
> - [PLANS.md](../../PLANS.md) - Plan structure and best practices

## Status: Backlog

**Goal**: Determine how (and whether) the volunteer-registration activity catalogue in Railway's PostgreSQL model ([Data model](../../../contributors/data-model.md)) should relate to Oslo Røde Kors activities returned by the Red Cross **Organizations API** (`getOrganizations`), using the 2026-04-21 dump at `terchris/api-getOrganizations-output-21apr26.json`.

**Last Updated**: 2026-05-19

---

## Background

Railway stores activities as **editorial rows** admins curate for the public registration wizard:

| Railway table | Role |
|---|---|
| `railway.activity_categories` | UI grouping only (e.g. «Ungdom», «Voksne og eldre») — not in the org API |
| `railway.activities` | One selectable volunteer option: `name`, `info`, `internal_info`, flags (`needs_volunteers`, `has_speaking_time`, `has_film_clip`, `is_enabled`), `sort_order` |

Submissions reference activities via `railway.registration_activities` (`activity_id` + `sort_order`). There is **no external identifier** on `activities` today — only `bigint id` and human-readable `name`.

The org API dump describes **branches** (local associations, districts, etc.) and, per branch, a list of activities:

```json
"branchActivities": [{
  "globalActivityName": "Digital leksehjelp",
  "localActivityName": "Digital leksehjelp Oslo Røde Kors"
}]
```

- **`globalActivityName`** — national taxonomy (~50 distinct values across all 392 branches in the dump).
- **`localActivityName`** — branch-specific label (often includes location or programme variant).

Today's production-shaped seed (`terchris/sample-data/02-activity-catalogue.sql`, extracted from Craft CMS) has **31 activities** in **5 categories**. That seed is what UIS loads and what Talk session 2 verified in admin. It was **not** generated from this org API file.

The same JSON dump is already used elsewhere (Atlas supply ingest) for **cross-chapter analytics**, not for volunteer registration UI. Railway needs its own answer: what does "connected" mean for Oslo's registration form?

**Source file (local, gitignored):** `terchris/api-getOrganizations-output-21apr26.json`  
**Metadata:** `totalCount: 392` branches, timestamp `2026-04-21T04:39:47.576Z`  
**Shape:** `{ data: { branches: [...] }, metadata: { totalCount, timestamp } }`

---

## Questions to Answer

1. **Purpose** — Why connect? (validation against national register, sync names, reporting to district systems, future API export of registrations, documentation only, or something else?)
2. **Cardinality** — Oslo has **55** API rows but only **28** unique `globalActivityName` values, while Railway has **31** distinct volunteer choices. Is the link 1:1 activity row ↔ one global name, 1:1 ↔ one local name, or many-to-many?
3. **Categories** — Org API has no equivalent to `activity_categories`. Keep Railway categories as purely editorial, or derive them from globals?
4. **Schema change** — Add columns on `activities` (`global_activity_name`, `local_activity_name`, `branch_id`), a separate `activity_external_refs` table, or no DB change (mapping file only)?
5. **Drift** — Who wins when Craft/admin text disagrees with API names? How often should Oslo's branch be re-fetched?
6. **Scope** — Oslo district only (`Oslo Røde Kors`), or design for any branch in the dump?
7. **Out of scope activities** — Several Railway rows (rich volunteer copy) have no clear global (e.g. «Stella kvinnesenter», «Ferie for alle»). Several globals (e.g. «Administrative oppgaver», «Distriktsstyre») are not volunteer-registration choices today. Include, hide, or map separately?

---

## Current State

### Railway data model (summary)

See [Data model](../../../contributors/data-model.md) and `db/03-tables.sql`:

- Editorial: `activity_categories` → `activities` (FK `category_id`).
- Submissions: `registration_activities` references `activities.id` with `ON DELETE RESTRICT` on the activity side.
- Public read: `public_form_payload` view bundles categories + enabled activities for the wizard.
- No external key fields on activities.

**Current Oslo-shaped seed** (`../../oslo-rodekors/railway-main/terchris/sample-data/02-activity-catalogue.sql`):

| Category | Activities |
|---|---|
| Ungdom | 9 (Digital leksehjelp … Kors på halsen) |
| Voksne og eldre | 14 |
| Beredskap | 3 |
| Barn og familie | 4 |
| Tilleggsaktiviteter (`is_additional=true`) | 1 (Ferie for alle) |

### Org API — Oslo Røde Kors branch

| Field | Value |
|---|---|
| `branchId` | `D003` |
| `branchName` | `Oslo Røde Kors` |
| `branchType` | `Distrikt` |
| `branchStatus.isActive` | `true` |
| `branchActivities` | **55 rows**, **28** unique `globalActivityName` |

A second Oslo-named branch exists (`Oslo Røde Kors Vestre Lokalforening`, `L032`) with **0** activities — not relevant for district-level catalogue mapping.

### Cardinality pattern (Oslo)

Many globals map to **multiple** `localActivityName` rows (programme/location splits). Examples:

| globalActivityName | local rows (count) | Notes |
|---|---:|---|
| Møteplass Fellesverkene | 10 | Grorud, Mortensrud, sentrum, «andre aktiviteter», etc. |
| Leksehjelp | 6 | Fellesverket sites + «leksehjelp for voksne» |
| Familiesenter | 7 | Includes MARTE, hytteguide, familiesenter variants |
| Administrative oppgaver | 5 | Not volunteer-facing in Railway today |
| Opplæring | 2 | Maps to seed «Kursvert» + «Kursholder» |

Railway's **Fellesverket** split (møteplass / leksehjelp / andre aktiviteter) and **BARK vs krisesenter** align with this many-to-one global pattern, but Railway uses **fewer, coarser** rows than the API's local granularity.

### Preliminary name alignment (draft — needs stakeholder review)

Rough mapping from current seed `activities.name` → Oslo `globalActivityName` (confidence: high / medium / low):

| Seed activity (Railway) | globalActivityName (API) | Confidence | Notes |
|---|---|---|---|
| Digital leksehjelp | Digital leksehjelp | high | |
| Mentorfamilie | Mentorfamilie | high | |
| Vennefamilie | Vennefamilie | high | |
| Gatemegling | Gatemegling | high | |
| Flyktningguide | Flyktningguide | high | |
| Vitnestøtte | Vitnestøtte | high | |
| Nettverk etter soning | Nettverk etter soning | high | |
| Akuttovernatting for bostedsløse | Akuttovernatting for bostedsløse tilreisende | high | Wording differs slightly |
| Digital norsktrening | Norsktrening | medium | API also has separate «Norsktrening» local rows |
| Norsktrening | Norsktrening | medium | Overlaps with digital variant in seed |
| Besøkstjenesten | Besøkstjeneste | high | API: «Besøksvenn med hund» is separate global |
| Barnas Røde Kors (BARK) | Barnas Røde Kors | high | API also lists krisesenter under same global |
| Aktiviteter for barn på krisesenter | Barnas Røde Kors | medium | Second local under same global |
| Familiesentre | Familiesenter | high | Spelling: centre vs center |
| MARTE nettverkssenter | Familiesenter | medium | API local: «MARTE Nettverkssenter Oslo Røde Kors» |
| Fellesverket - møteplass | Møteplass Fellesverkene | high | |
| Fellesverket - leksehjelp | Leksehjelp | medium | Shared global with «leksehjelp for voksne» |
| Leksehjelp for voksne | Leksehjelp | medium | |
| Fellesverket – andre aktiviteter | Møteplass Fellesverkene | low | May be «Øvrige aktiviteter - Røde Kors Ungdom» — needs product call |
| Røde Kors Ungdom | Treffpunkt - Røde Kors Ungdom | medium | RKU org row vs treffpunkt global |
| Kors på halsen | Kors på Halsen | high | Casing |
| Hjelpekorpset | Hjelpekorps | high | |
| Blodgivergruppen | Blodgiververving | high | Different display names |
| Visitor - besøk i fengsel | Visitor | high | |
| Kursvert | Opplæring | medium | Shared global with Kursholder |
| Kursholder | Opplæring | medium | |
| Stella kvinnesenter | Kompetansesenter | low | API local: «Stella – Røde Kors kvinnesenter» |
| Helsesenter for papirløse migranter | — | low | No global in Oslo branch list |
| Datahjelp | — | low | No global |
| Ferie for alle | — | low | Tilleggsaktivitet; likely out of org register |
| Førstehjelpsveiledere | — | medium | May relate to Hjelpekorps / Opplæring indirectly |

**Globals in Oslo API with no Railway seed row** (28 globals minus mapped ≈ 7+): Administrative oppgaver, Beredskap, Besøksvenn med hund, Distriktsstyre, Kompetansesenter (as primary), Opplæring (unmapped if kurs rows disabled), Sporadisk frivillige, Møteplasser, etc.

### Related artefacts (not the same API)

| Artefact | Location | Relationship |
|---|---|---|
| Craft dump + `extract-from-craft-dump.py` | `oslo-rodekors/railway-main/terchris/sample-data/` | **Source of truth today** for Railway seeds |
| `2026-03-03-orgunits.json` | same folder | Visma org structure — reference only |
| `oslo-volunteer-orgs.csv` | same folder | 34 Oslo volunteer org units — HR/payroll shaped, not `branchActivities` |
| Atlas Red Cross ingest | `helpers/atlas` | Same JSON dump → `raw.redcross_branch_activities`; maps globals to `service_category_code` for **analytics**, not registration UI |

---

## Options

### Option A: Documentation-only mapping (no schema change)

Maintain a checked-in CSV/JSON beside sample-data: `railway_activity_id` ↔ `globalActivityName` (+ optional `localActivityName`). Used for manual audits and docs; admin UI unchanged.

**Pros:** No migration, no RLS changes, fast to prototype.  
**Cons:** Drift unless someone re-runs diff scripts; not visible in admin.

### Option B: Add nullable columns on `railway.activities`

e.g. `global_activity_name text`, `org_branch_id text` (default `D003` for Oslo), optionally `primary_local_activity_name text`.

**Pros:** Single table; PostgREST admin can show/edit; submissions stay on `activity_id`.  
**Cons:** Does not model 1-global → many-locals; migration + seed update + admin forms.

### Option C: Junction table `activity_org_refs`

`activity_id`, `branch_id`, `global_activity_name`, `local_activity_name` (nullable), unique on (`activity_id`, `branch_id`, `global_activity_name`, `local_activity_name`).

**Pros:** Captures many-to-many; one Railway row can link several API locals.  
**Cons:** More complex admin UX and seeds.

### Option D: Replace / regenerate catalogue from API

Script builds `activities` (+ categories heuristic) from Oslo `branchActivities`, dropping Craft `info` text unless merged from a sidecar.

**Pros:** Stays in sync with national register.  
**Cons:** Loses rich volunteer copy, flags, and editorial categories; high product risk.

### Option E: Sync job (future)

Periodic fetch of live `getOrganizations` (API key TBD — Atlas notes key required for live polls) → diff report for admins, no auto-write.

**Pros:** Operational safety.  
**Cons:** Needs credentials, scheduling, and UI for diffs.

---

## Initial Findings

1. **The two models serve different layers.** API = «what the district registers in the national branch system»; Railway = «what a volunteer can pick on the form this season», with long descriptions and admin-only notes. They overlap heavily but are not isomorphic.

2. **Oslo API is finer-grained locally.** 55 locals vs 31 Railway rows — connection is inherently **many API locals → one Railway activity** (or unmapped locals ignored).

3. **`globalActivityName` is the natural join key** for cross-system reporting, not `localActivityName` and not `activities.name` (typos, spelling, Norwegian variants).

4. **Categories remain Railway-specific** unless product wants to collapse Ungdom/Voksne using an external taxonomy (not present in this API).

5. **Prior art exists in Atlas** for global-name inventory and service-category mapping — reuse for **analysis scripts**, not copy-paste into Railway schema without a product decision.

6. **The JSON file should stay gitignored** under `/terchris/` (see root `.gitignore`); document path in plans and optionally add a small committed **extract** (Oslo branch only) if CI needs it.

---

## Recommendation (investigation phase)

Before any PLAN:

1. **Confirm purpose with stakeholder** (Oslo admin / product): validation only, reporting export, or true bidirectional sync?
2. **Produce a committed mapping artefact** — machine-readable table of all 31 seed IDs with proposed `globalActivityName`, confidence, and notes; plus list of unmapped Oslo locals/globals.
3. **Prefer Option A or B** for v1:
   - **A** if connection is audit/documentation;
   - **B** if admins need to see the national name in Railway admin and filters.
4. **Defer Option D and live Option E** unless Oslo explicitly wants the form driven by the org API.

---

## Next Steps

- [ ] Stakeholder answers **Questions to Answer** §1 and §7 (purpose + out-of-scope globals).
- [ ] Run a scripted diff (extend or new script under `scripts/`) producing:
  - `terchris/oslo-activity-mapping-draft.csv` (or under `sample-data/` in Craft repo)
  - counts: matched / seed-only / api-only
- [ ] Review draft mapping table with someone who knows Oslo programmes (Fellesverket splits, Stella, RKU).
- [ ] Decide schema approach (Options A–C).
- [ ] Create **`PLAN-*.md`** only after the above — likely `PLAN-activity-org-api-mapping.md` (schema + seed + admin display) separate from any live-sync PLAN.

---

## References

| Topic | Location |
|---|---|
| Railway data model (ERD) | [website/docs/contributors/data-model.md](../../../contributors/data-model.md) |
| DDL | `db/03-tables.sql` |
| Activity seed | `oslo-rodekors/railway-main/terchris/sample-data/02-activity-catalogue.sql` |
| Extraction pipeline | `oslo-rodekors/railway-main/terchris/sample-data/extract-from-craft-dump.py` |
| Org API dump (local) | `terchris/api-getOrganizations-output-21apr26.json` |
| Atlas: same dump, supply ingest | `helpers/atlas/website/docs/ai-developer/plans/completed/PLAN-002-redcross-ingest.md` |
| Atlas: NGO supply investigation | `helpers/atlas/website/docs/ai-developer/plans/completed/INVESTIGATE-ngo-supply-data-model.md` |
