# App screenshots (Railway Next)

Full-page captures of the main UI states. **IDs** use the `rwg-` prefix (Railway / web GUI) and a short slug so you can refer to them in issues and docs (for example «see **rwg-adm-app-log**»).

## Regenerate

With the app running on **`http://localhost:3010`** (or set **`APP_URL`**):

```bash
npm run docs:screens
```

**Admin shots** need a working staff JWT in the **server** environment (`POSTGREST_ADMIN_JWT` / `POSTGREST_STAFF_JWT_UIS` matching `JWT_SECRET`) and bootstrap allowed (`next dev` or `ADMIN_BOOTSTRAP_SESSION_FROM_ENV=1`). If bootstrap fails, only public + login images are produced plus **`rwg-adm-bootstrap-failed.png`** (see script output).

Detail pages (registration, activity, language, etc.) pick the **first row link** on each list — your PNGs depend on seed data.

## Social promo video (English burned-in captions)

Two **mute** H.264 exports (add music / voiceover in Instagram, TikTok, or CapCut if you like — use royalty-free audio only):

| File | Use case |
| --- | --- |
| [railway-promo-1080x1920-vertical.mp4](./railway-promo-1080x1920-vertical.mp4) | **9:16** — Reels, Shorts, TikTok, Stories |
| [railway-promo-1920-wide.mp4](./railway-promo-1920-wide.mp4) | **16:9** — LinkedIn, X, YouTube |

Regenerate after updating PNGs:

```bash
npm run video:promo
```

Script: `scripts/build-promo-video.mjs` (uses **ffmpeg-static**). Temp files go to `doc/screenshots/.video-build/` (gitignored). Narration is **English** so international followers can follow; the UI in the footage stays **Norwegian**.

## Catalogue

| ID | Route / context | Beskrivelse | Screenshot |
| --- | --- | --- | --- |
| **rwg-pub-home** | `/` | Startside med veiviser (steg 1 · intro). | [rwg-pub-home.png](./rwg-pub-home.png) |
| **rwg-pub-wizard-intro** | `/` | Veiviser steg 1 · intro (eksplisitt). | [rwg-pub-wizard-intro.png](./rwg-pub-wizard-intro.png) |
| **rwg-pub-wizard-activities** | `/` | Veiviser steg 2 · aktiviteter. | [rwg-pub-wizard-activities.png](./rwg-pub-wizard-activities.png) |
| **rwg-pub-wizard-about** | `/` | Veiviser steg 3 · om deg. | [rwg-pub-wizard-about.png](./rwg-pub-wizard-about.png) |
| **rwg-pub-wizard-confirmation** | `/` | Veiviser steg 4 · bekreftelse. | [rwg-pub-wizard-confirmation.png](./rwg-pub-wizard-confirmation.png) |
| **rwg-pub-thank-you** | `/thank-you` | Takkeside etter innsending. | [rwg-pub-thank-you.png](./rwg-pub-thank-you.png) |
| **rwg-pub-thank-you-membership** | `/thank-you?complete-membership=true` | Takkeside med hint om medlemskap / flere valg. | [rwg-pub-thank-you-membership.png](./rwg-pub-thank-you-membership.png) |
| **rwg-adm-login** | `/admin/login?manual=1` | Innlogging (staff‑JWT / bootstrap‑passord). | [rwg-adm-login.png](./rwg-adm-login.png) |
| **rwg-adm-overview** | `/admin` | Admin oversikt (dashboard). | [rwg-adm-overview.png](./rwg-adm-overview.png) |
| **rwg-adm-registrations** | `/admin/registrations` | Registreringer · liste/tabell. | [rwg-adm-registrations.png](./rwg-adm-registrations.png) |
| **rwg-adm-registration-detail** | `/admin/registrations/[id]` | Detaljside én registrering (første rad). | [rwg-adm-registration-detail.png](./rwg-adm-registration-detail.png) |
| **rwg-adm-activities** | `/admin/activities` | Aktiviteter · liste. | [rwg-adm-activities.png](./rwg-adm-activities.png) |
| **rwg-adm-activities-new** | `/admin/activities/new` | Ny aktivitet. | [rwg-adm-activities-new.png](./rwg-adm-activities-new.png) |
| **rwg-adm-activity-detail** | `/admin/activities/[id]` | Rediger aktivitet (første rad). | [rwg-adm-activity-detail.png](./rwg-adm-activity-detail.png) |
| **rwg-adm-additional-activities** | `/admin/additional-activities` | Tilleggsaktiviteter (filtret liste). | [rwg-adm-additional-activities.png](./rwg-adm-additional-activities.png) |
| **rwg-adm-activity-categories** | `/admin/activity-categories` | Aktivitetskategorier og rekkefølge. | [rwg-adm-activity-categories.png](./rwg-adm-activity-categories.png) |
| **rwg-adm-activity-settings** | `/admin/activity-settings` | Aktivitet – valggrenser (singleton). | [rwg-adm-activity-settings.png](./rwg-adm-activity-settings.png) |
| **rwg-adm-activities-text** | `/admin/activities-text` | Tekster på aktivitetsteget. | [rwg-adm-activities-text.png](./rwg-adm-activities-text.png) |
| **rwg-adm-text-content** | `/admin/text-content` | Alle skjematekster (`text_content`). | [rwg-adm-text-content.png](./rwg-adm-text-content.png) |
| **rwg-adm-print-manuscript** | `/admin/print/manuscript` | Utskrift · manuskript. | [rwg-adm-print-manuscript.png](./rwg-adm-print-manuscript.png) |
| **rwg-adm-print-form** | `/admin/print/form` | Utskrift · papirskjema. | [rwg-adm-print-form.png](./rwg-adm-print-form.png) |
| **rwg-adm-skemadata** | `/admin/skemadata` | Hub for språk / medlemskap / evaluering m.m. | [rwg-adm-skemadata.png](./rwg-adm-skemadata.png) |
| **rwg-adm-app-log** | `/admin/app-log` | App‑logg · liste og filtre. | [rwg-adm-app-log.png](./rwg-adm-app-log.png) |
| **rwg-adm-staff** | `/admin/staff` | Mine tilganger · JWT/caps (MVP). | [rwg-adm-staff.png](./rwg-adm-staff.png) |
| **rwg-adm-eval-questions** | `/admin/evaluation/questions` | Evalueringsspørsmål · liste. | [rwg-adm-eval-questions.png](./rwg-adm-eval-questions.png) |
| **rwg-adm-eval-question-detail** | `/admin/evaluation/questions/[id]` | Rediger evalueringsspørsmål (første rad). | [rwg-adm-eval-question-detail.png](./rwg-adm-eval-question-detail.png) |
| **rwg-adm-eval-options** | `/admin/evaluation/options` | Evalueringsalternativer · liste. | [rwg-adm-eval-options.png](./rwg-adm-eval-options.png) |
| **rwg-adm-eval-option-detail** | `/admin/evaluation/options/[id]` | Rediger evalueringsalternativ (første rad). | [rwg-adm-eval-option-detail.png](./rwg-adm-eval-option-detail.png) |
| **rwg-adm-languages** | `/admin/languages` | Språk · liste. | [rwg-adm-languages.png](./rwg-adm-languages.png) |
| **rwg-adm-language-detail** | `/admin/languages/[id]` | Rediger språk (første rad). | [rwg-adm-language-detail.png](./rwg-adm-language-detail.png) |
| **rwg-adm-membership-statuses** | `/admin/membership-statuses` | Medlemskap – status · liste. | [rwg-adm-membership-statuses.png](./rwg-adm-membership-statuses.png) |
| **rwg-adm-membership-status-detail** | `/admin/membership-statuses/[id]` | Rediger status (første rad). | [rwg-adm-membership-status-detail.png](./rwg-adm-membership-status-detail.png) |
| **rwg-adm-membership-options** | `/admin/membership-options` | Medlemskap – alternativer · liste. | [rwg-adm-membership-options.png](./rwg-adm-membership-options.png) |
| **rwg-adm-membership-option-detail** | `/admin/membership-options/[id]` | Rediger medlemskap-alternativ (første rad). | [rwg-adm-membership-option-detail.png](./rwg-adm-membership-option-detail.png) |
| **rwg-adm-no-selected-options** | `/admin/no-selected-options` | Ingen valgte alternativer · liste. | [rwg-adm-no-selected-options.png](./rwg-adm-no-selected-options.png) |
| **rwg-adm-no-selected-option-detail** | `/admin/no-selected-options/[id]` | Rediger «ingen aktivitet»-alternativ (første rad). | [rwg-adm-no-selected-option-detail.png](./rwg-adm-no-selected-option-detail.png) |

## Ikke eget skjermskudd

| ID / referanse | Årsak |
| --- | --- |
| **`GET /admin/registrations/export`** | CSV-nedlasting — ikke en egen layout-side (åpnes som fil). Lenke fra **rwg-adm-registrations**. |
| **rwg-adm-bootstrap-failed** | Bare når `npm run docs:screens` ikke får admin-økt; da skrives denne PNG av skriptet. |

## Id-konvensjon

- **`rwg-pub-…`** — offentlig frivilligregistrering.
- **`rwg-adm-…`** — admin (`/admin/*`).
