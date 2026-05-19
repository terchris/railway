---
sidebar_position: 5
---

# App-logg-leser — drift og varselsovervåking

App-logg-leser har **kun lese-tilgang til driftsloggen**. Brukes til å oppdage spam-bølger, ingressfeil, eller andre uregelmessigheter i påmeldingsstrømmen — uten å gi tilgang til selve påmeldingsdataene eller innholdsredigeringen.

## Slik logger du inn

Åpne `http://<host>/admin/login`. I rollevelgeren klikker du **App-log viewer**.

![Innloggingssiden med rollevelger — klikk «App-log viewer»-raden](/img/screenshots/rwg-adm-login.png)

Du lander på `/admin`. Sidemenyen viser **tre grupper**: Oversikt, Drift, Konto.

JWT-en din inneholder kun `app_log:read`. Du kan ikke kvittere varsler (det krever `app_log:write`).

## Hva du kan gjøre

### Oversikt

Forsiden. Antallet «åpne varsler» vises i ett av kortene.

> **Kjent feil:** Kortet «App-log · åpne varsler» feiler i dag med `permission denied for function app_log_alert_count` for alle roller, inkludert deg. Resten av Oversikt-siden virker normalt; bare det ene kortet er rammet. Se [Investigate: app_log_alert_count permission](../../ai-developer/plans/backlog/INVESTIGATE-app-log-alert-count-permission.md).

→ [Detaljer](../surfaces/overview.md)

### Drift

Selve loggen. Filter på type (INFO/WARNING/ERROR/REGISTRATION) og «kun åpne varsler».

![App-loggen med filter og tabell](/img/screenshots/rwg-adm-app-log.png)

→ [App-logg](../surfaces/app-log.md)

### Konto

Sjekke JWT-status.

→ [Mine tilganger](../surfaces/staff.md)

## Hva du **ikke** kan gjøre

- **Kvittere åpne varsler** — knappen «Kvitt varsel» på App-logg-siden krever `app_log:write`. Du ser knappen muligens, men kallet vil avvises av PostgREST. Eskaler til [Full administrator](full-admin.md) hvis et varsel må kvitteres.
- **Se påmeldinger** — `registrations:read` mangler. Sidemenygruppen «Registreringer» er ikke synlig.
- **Endre innhold** — `content:read` / `content:write` mangler. Sidemenygruppen «Aktivitet og skjema» og «Utskrift» er ikke synlig.

For en bredere rolle, bytt til [Full administrator](full-admin.md). For en spesifikk annen rolle, se rolletabellen i [Administrasjon](index.md).

## Relatert

- [Slik logger du inn](../surfaces/login.md)
- [Mine tilganger](../surfaces/staff.md) — bekrefte JWT-status
- [App-logg](../surfaces/app-log.md) — selve flaten du jobber på
