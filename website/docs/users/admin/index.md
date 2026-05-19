---
sidebar_position: 1
---

# Administrasjon

Du har en stab-konto for Railway og logger inn på `/admin`. Velg rollen du skal jobbe som i innloggingsvelgeren.

![Innloggingssiden med rollevelgeren](/img/screenshots/rwg-adm-login.png)

## Velg din rolle

| Rolle | Hva du gjør | Kapabiliteter |
|---|---|---|
| [Full administrator](full-admin.md) | Alt — registreringer, innhold, drift | `admin` (alle 9 kapabiliteter) |
| [Registreringsadministrator](registrations-admin.md) | Lese og oppdatere påmeldinger | `registrations:read`, `registrations:write` |
| [Innholdsredaktør](content-editor.md) | Aktiviteter, evaluering, språk, skjematekster, utskrift | `content:read`, `content:write` |
| [App-logg-leser](app-log-viewer.md) | Driftslogg og varsler fra honningfeller | `app_log:read` |
| [Brukeradministrator](users-admin.md) | Brukere og tilganger (ingen UI-flater enda) | `users:read`, `users:write` |

Hver rolle har sin egen side med oversikt over hva du ser og kan gjøre. Hvis du logger inn med flere kapabiliteter — eller bytter rolle midt i arbeidet — vil sidemenyen oppdatere seg deretter; rolle-sidene beskriver tilgangsnivået du har akkurat nå.

## Per-skjerm-referanse

Alle admin-skjermbildene er detaljbeskrevet under [Skjermbilder](../surfaces/overview.md) (starter med [Oversikt](../surfaces/overview.md)). Rolle-sidene over linker til de skjermene som er relevante for hver rolle.

## For utviklere

Roller og kapabiliteter er definert i `db/01-roles.sql` og håndheves av PostgREST og Row-Level Security. Se:

- [PostgreSQL-roller](../../contributors/postgres-roles.md) — hvordan `anon` og `authenticated` mappes til database-roller
- [Test av dummy-innlogging](../../contributors/testing-dummy-login.md) — funksjonell sjekkliste per rolle
- [PLAN: Dummy login picker](../../ai-developer/plans/completed/PLAN-dummy-login.md) — design av rollevelgeren
