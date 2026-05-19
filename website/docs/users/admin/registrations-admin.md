---
sidebar_position: 3
---

# Registreringsadministrator

**Kapabiliteter:** `registrations:read`, `registrations:write`
**Sidemenygrupper du ser:** Oversikt, Registreringer, Konto

![Innloggingssiden — klikk «Registrations admin»-raden](/img/screenshots/rwg-adm-login.png)

> **TBD** — fullstendig hub-side fylles ut i Fase 5 av [PLAN-user-documentation](../../ai-developer/plans/active/PLAN-user-documentation.md).

Detaljsider du har tilgang til:

- [Oversikt](../surfaces/overview.md)
- [Mine tilganger](../surfaces/staff.md)
- [Registreringer](../surfaces/registrations.md), [CSV-eksport](../surfaces/registrations-export.md)

Du ser **ikke** Utskrift, Aktivitet og skjema, eller Drift — JWT-en din mangler `content:read` og `app_log:read`. Hvis du trenger disse, bytt til **Full administrator** eller den spesifikke rollen som dekker oppgaven.
