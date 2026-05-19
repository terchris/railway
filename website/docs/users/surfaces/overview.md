---
sidebar_position: 1
---

# Oversikt — `/admin`

**Hvem ser dette:** Alle stab-roller
**Krever kapabilitet:** (ingen — men kortene viser kun data hvis JWT-en din har de relevante kapabilitetene)

![Oversiktssiden med fire kort: registreringer, app-logg, skjemainnhold, og videre innhold](/img/screenshots/rwg-adm-overview.png)

## Hva siden gjør

Førstesiden i administrasjonsgrensesnittet. Viser et raskt sammendrag og lenker inn til de viktigste oppgavene. Du lander her direkte etter innlogging.

## Hva du ser

Fire kort i et 2 × 2-rutenett:

- **Antall registreringer** — totalt antall påmeldinger i `railway.registrations`. Krever `registrations:read`. Lenken **«Åpne tabellen →»** tar deg til [Registreringer](registrations.md).
- **App-logg · åpne varsler** — antall rader i `railway.app_log` med `alert = true`. Krever `app_log:read`. To lenker: **«Åpne app-logg →»** ([App-logg](app-log.md)) og **«GET /api/health →»** (helse-endepunkt for ekstern overvåking).
- **Skjemainnhold · aktiviteter** — fire snarveier til innholdsredigering: [Aktivitetstabell](activities.md), [Kategorier](activity-categories.md), [Valg-grenser](activity-settings.md), [Tekster på aktivitetsteget](activities-text.md). Også en lenke til det offentlige skjemaet for forhåndsvisning: **«Åpne frivilligskjema →»**.
- **Videre innhold i skjema** — informasjonskort som forklarer at språkliste, medlemskap, «ingen aktivitet»-alternativer, og evalueringsspørsmål ligger som egne sider under [Skjemadata](skemadata.md).

## Vanlige oppgaver

- **Sjekke status hver morgen** — antall nye registreringer i kortet til venstre; åpne varsler i kortet til høyre. Hvis varseltallet er rødt, åpne App-loggen for å se hvilke varsler som krever oppfølging.
- **Komme i gang med innholdsredigering** — bruk kort tre («Skjemainnhold») som sentral hub. Aktivitetsredigering er den vanligste oppgaven.
- **Bekrefte at innloggingen virket** — hvis du ser tall i kortene (ikke «Krever staff-JWT»), er økten i orden.

## Fallgruver

- **«Krever staff-JWT.»** under et kort betyr at JWT-en din mangler kapabiliteten kortet krever. Sjekk [Mine tilganger](staff.md) for hva tokenet ditt faktisk inneholder.
- **«App-logg · åpne varsler» viser feilmelding** (`permission denied for function app_log_alert_count`) for alle stab-roller per i dag — kjent feil. Se [Investigate: app_log_alert_count permission](../../ai-developer/plans/backlog/INVESTIGATE-app-log-alert-count-permission.md). Resten av siden virker som normalt; bare dette kortet er rammet.
- Tall i kortene er **eksakte** (PostgREST `count=exact`), ikke estimater.

## Relatert

- [Registreringer](registrations.md) — der «Åpne tabellen» tar deg
- [App-logg](app-log.md) — der «Åpne app-logg» tar deg
- [Mine tilganger](staff.md) — sjekk kapabilitetene dine
- [Slik logger du inn](login.md) — hvis du må logge inn på nytt
