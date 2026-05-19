---
sidebar_position: 6
---

# Brukeradministrator

**Kapabiliteter:** `users:read`, `users:write`
**Sidemenygrupper du ser:** Oversikt, Konto

![Innloggingssiden — klikk «Users admin»-raden](/img/screenshots/rwg-adm-login.png)

> **TBD** — fullstendig hub-side fylles ut i Fase 5 av [PLAN-user-documentation](../../ai-developer/plans/active/PLAN-user-documentation.md).

Detaljsider du har tilgang til:

- [Oversikt](../surfaces/overview.md)
- [Mine tilganger](../surfaces/staff.md)

**Merknad**: det finnes ingen sidemeny-elementer som krever `users:read` eller `users:write` i dag. Rollen er klargjort for fremtidige brukerhåndteringsskjermbilder. Kapabilitetene håndheves likevel av PostgREST og RLS på databasenivå — selv om UI-flater mangler, kan en brukeradministrator kalle relevante endepunkt direkte.
