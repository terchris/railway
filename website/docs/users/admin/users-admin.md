---
sidebar_position: 6
---

# Brukeradministrator — klargjort for fremtiden

Brukeradministrator har `users:read` og `users:write` — kapabiliteter som er **klargjort for fremtidige brukerhåndteringsskjermbilder, men ikke koblet til noen UI-flater i dag.** Rollen finnes i picker-en for å gjøre kapabilitetsmodellen komplett og for å støtte direkte API-kall mot PostgREST.

## Slik logger du inn

Åpne `http://<host>/admin/login`. I rollevelgeren klikker du **Users admin**.

![Innloggingssiden med rollevelger — klikk «Users admin»-raden](/img/screenshots/rwg-adm-login.png)

Du lander på `/admin`. Sidemenyen viser bare **to grupper**: Oversikt, Konto. Det er ingen UI-flater som er kapabilitetsgated på `users:*` i dag.

## Hva du kan gjøre

### Oversikt

Forsiden. De fleste kortene viser «Krever staff-JWT» fordi du mangler `registrations:read`, `content:read`, og `app_log:read`.

→ [Detaljer](../surfaces/overview.md)

### Konto

Sjekke at JWT-en din er gyldig og at `users:read`/`users:write` faktisk ligger i `capabilities`-arrayet.

→ [Mine tilganger](../surfaces/staff.md)

### Direkte API-tilgang

Kapabilitetene `users:read` og `users:write` er håndhevet av PostgREST og RLS på databasenivå. Selv om Next-appen ikke har UI for det, kan en brukeradministrator kalle relevante PostgREST-endepunkt direkte med JWT-en sin — for eksempel via `curl`. Tabellen `auth.users` er **ikke eksponert gjennom PostgREST** i dagens oppsett (kun `railway`-skjemaet er); brukerhåndteringen foregår derfor via UIS og direkte tilkobling til databasen. Se [Mine tilganger](../surfaces/staff.md) for kontekst.

## Hva du **ikke** kan gjøre

- **Se påmeldinger** — `registrations:read` mangler.
- **Endre innhold** — `content:read`/`content:write` mangler.
- **Se app-loggen** — `app_log:read` mangler.

Hvis du trenger noen av disse, bytt til [Full administrator](full-admin.md) eller den spesifikke rollen.

## Når denne rollen får UI-flater

Når brukerhåndtering legges til som egen flate i administrasjonsgrensesnittet, vil sidemenyen utvides med en «Brukere»-gruppe synlig kun for denne rollen + Full administrator. Inntil videre er rollen mer et **kapabilitets-løfte** enn en arbeidsflate.

## Relatert

- [Slik logger du inn](../surfaces/login.md)
- [Mine tilganger](../surfaces/staff.md)
- [PostgreSQL-roller](../../contributors/postgres-roles.md) — utviklerforklaring av brukerhåndteringen i UIS
- [Test av dummy-innlogging](../../contributors/testing-dummy-login.md) — utviklerens funksjonelle sjekkliste for denne rollen
