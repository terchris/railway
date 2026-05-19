---
sidebar_position: 21
---

# App-logg — `/admin/app-log`

**Hvem ser dette:** Full administrator, App-logg-leser
**Krever kapabilitet:** `app_log:read` (lesing), `app_log:write` (kvittere varsel)

![Driftslogg med varsler fra honningfeller og innsendingsfeil](/img/screenshots/rwg-adm-app-log.png)

## Hva siden gjør

Logg over **driftshendelser** fra Railway. Tabellen `railway.app_log` skriver én rad per hendelse — registreringer, varsler fra honningfelle-treff, og generelle systemfeil. Brukes for å oppdage spam-bølger, ingressfeil, og uregelmessigheter i påmeldingsstrømmen.

## Hva du ser

### Filterrad (øverst)

Knappene **«Kun åpne varsler»** og **«Alle typer»**, pluss type-filtre **`INFO`**, **`WARNING`**, **`ERROR`**, **`REGISTRATION`**. Klikk en knapp for å filtrere; aktiv filter har fylt farge.

### Tabell

Kolonner:

- **Tid** — dato og klokkeslett (norsk format)
- **Type** — farget merkelapp (`INFO` grå, `WARNING` gul, `ERROR` rød, `REGISTRATION` blå)
- **Kategori** — kortform, f.eks. `honeypot`, `submit`, `health`
- **Varsel** — `Ja` (rad uthevet rødt) eller `Nei`
- **Melding** — fri tekst eller JSON, vises med max-høyde og skrolling
- **Handling** — knappen **«Kvitt varsel»** for rader med `Varsel = Ja` (krever `app_log:write`)

Paginering: 50 rader per side.

## Vanlige oppgaver

- **Sjekke om en spam-bølge pågår** — filtrer på `WARNING` + kategori-søk `honeypot`. Hvis du ser mange rader på kort tid, ble formet under angrep.
- **Kvittere et behandlet varsel** — klikk **«Kvitt varsel»** i Handling-kolonnen. Setter `alert = false` i databasen; raden mister rød bakgrunn neste gang du laster siden.
- **Lese stakksporing av en feilet innsending** — finn raden med type `ERROR`, klikk på melding-feltet for å lese hele teksten. JSON-strukturert melding viser ofte hvilket felt som feilet.

## Fallgruver

- **«Kvitt varsel»-knappen krever `app_log:write`** — synlig kun for roller som har det. App-logg-leser kan lese, ikke kvittere; må eskalere til Full administrator.
- **Sletting støttes ikke** fra denne flaten — loggen vokser. Be utvikleren om en oppryddingsjobb hvis databasen blir for stor.
- **Honningfelle-treff har `category = honeypot`** — innebygd antispam-detektor; flere treff i samme minutt er typisk en bot.

## Relatert

- [Oversikt](overview.md) — kortet «App-logg · åpne varsler» har kjent feil (se nedenfor)
- [Investigate: app_log_alert_count permission](../../ai-developer/plans/backlog/INVESTIGATE-app-log-alert-count-permission.md) — bakgrunn for varseltell-feilen på Oversikt
- [Slik melder du deg på](../public-registration.md) — det åpne skjemaet som genererer `REGISTRATION`-rader
