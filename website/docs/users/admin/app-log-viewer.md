---
sidebar_position: 5
---

# App-logg-leser

**Kapabiliteter:** `app_log:read`
**Sidemenygrupper du ser:** Oversikt, Drift, Konto

![Innloggingssiden — klikk «App-log viewer»-raden](/img/screenshots/rwg-adm-login.png)

> **TBD** — fullstendig hub-side fylles ut i Fase 5 av [PLAN-user-documentation](../../ai-developer/plans/active/PLAN-user-documentation.md).

Detaljsider du har tilgang til:

- [Oversikt](../surfaces/overview.md)
- [Mine tilganger](../surfaces/staff.md)
- [App-logg](../surfaces/app-log.md)

Du ser **ikke** Registreringer, Utskrift eller Aktivitet og skjema — JWT-en din mangler `registrations:read` og `content:read`. Hvis du trenger disse, bytt til **Full administrator** eller den spesifikke rollen.
