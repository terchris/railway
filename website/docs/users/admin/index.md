---
sidebar_position: 1
---

# Administrasjon

Du har en stab-konto for Railway og logger inn på `/admin`. Denne seksjonen er **under arbeid** — fylles ut i de neste fasene av [PLAN-user-documentation](../../ai-developer/plans/active/PLAN-user-documentation.md).

## Roller

Det finnes fem typer stab-konto. Hver type ser sin del av administrasjonsmenyen og kan utføre sine oppgaver. Innloggingssiden viser en rollevelger der du kan logge inn som hver rolle:

- **Full administrator** — ser alt, kan alt. *(Guide kommer i Fase 5.)*
- **Registreringsadministrator** — kun registreringer. *(Guide kommer i Fase 5.)*
- **Innholdsredaktør** — aktiviteter, evaluering, språk, skjematekster, utskrift. *(Guide kommer i Fase 5.)*
- **App-logg-leser** — kun app-loggen / driftsvarsler. *(Guide kommer i Fase 5.)*
- **Brukeradministrator** — brukere og tilganger *(ingen UI-flater enda; guide kommer i Fase 5).*

For utviklere som vil forstå hvordan rollene er definert teknisk: se [PostgreSQL-roller](../../contributors/postgres-roles.md) og [Test av dummy-innlogging](../../contributors/testing-dummy-login.md).

![Innloggingssiden med rollevelgeren](/img/screenshots/rwg-adm-login.png)
