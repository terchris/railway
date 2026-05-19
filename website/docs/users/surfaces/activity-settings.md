---
sidebar_position: 8
---

# Aktivitetsinnstillinger — `/admin/activity-settings`

**Hvem ser dette:** Full administrator, Innholdsredaktør
**Krever kapabilitet:** `content:read` (lesing), `content:write` (endring)

![Innstillingsskjema for valg-grenser på aktivitetstrinnet](/img/screenshots/rwg-adm-activity-settings.png)

## Hva siden gjør

Styrer **hvor mange aktiviteter** en bruker kan eller må velge på det offentlige skjemaet. For eksempel: «minst én, høyst tre», eller «valgfritt».

## Hva du ser

Et lite skjema med to felter:

- **Minimum aktiviteter** — laveste antall valg før skjemaet kan sendes.
- **Maksimum aktiviteter** — øverste tak. 0 betyr ingen øvre grense.

Pluss en lagre-knapp.

## Vanlige oppgaver

- **Tillate at brukere melder seg uten aktivitet** — sett minimum til 0, og sørg for at det finnes minst ett alternativ under [«Ingen aktivitet»-alternativer](no-selected-options.md).
- **Begrense til én aktivitet per påmelding** — sett minimum og maksimum til 1.
- **Fjerne den øvre grensen** — sett maksimum til 0.

## Fallgruver

- **Endring slår igjennom umiddelbart** for nye påmeldinger. Eksisterende registreringer som ble lagret med andre grenser, er fortsatt gyldige.
- **Maksimum lavere enn minimum** bør skjemaet avvise, men dobbeltsjekk verdiene før du lagrer.

## Relatert

- [Aktiviteter](activities.md) — det aktivitetstrinnet disse grensene gjelder for
- [«Ingen aktivitet»-alternativer](no-selected-options.md) — vises når minimum er 0
- [Aktivitetstekster](activities-text.md) — forklaringsteksten brukeren ser
