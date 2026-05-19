---
sidebar_position: 13
---

# Evalueringsspørsmål — `/admin/evaluation/questions`

**Hvem ser dette:** Full administrator, Innholdsredaktør
**Krever kapabilitet:** `content:read` (lesing), `content:write` (endring)

![Liste over evalueringsspørsmål](/img/screenshots/rwg-adm-eval-questions.png)

![Detaljvisning for ett evalueringsspørsmål](/img/screenshots/rwg-adm-eval-question-detail.png)

## Hva siden gjør

Definerer de spørsmålene brukeren får på evalueringstrinnet i det offentlige skjemaet. Hvert spørsmål er enten en **nedtrekksliste** (med svaralternativer fra [Evalueringssvar](eval-options.md)) eller et **fritekstfelt**.

## Hva du ser

### Liste-visningen

Tabell med spørsmålene:

- **Spørsmålstekst** (det brukeren leser)
- **Type** — `select` (nedtrekksliste) eller `text` (fritekst)
- **Rekkefølge** — hvor spørsmålet vises på trinnet
- **Aktiv** — av/på

### Detalj-visningen (`/admin/evaluation/questions/<id>`)

Skjema med spørsmålstekst (norsk), type-nedtrekk, sorteringsrekkefølge, og aktiv-bryter. Lagre-knapp.

## Vanlige oppgaver

- **Legge til et nytt spørsmål** — opprett fra detaljsiden eller liste-toppen. Velg type først; nedtrekks-spørsmål peker på samme felles liste i [Evalueringssvar](eval-options.md).
- **Endre rekkefølgen** — juster sorteringsrekkefølge på detaljsiden, lagre.
- **Slå av et spørsmål midlertidig** — bruk aktiv-bryter i stedet for å slette. Det bevarer historiske svar i databasen.

## Fallgruver

- **`select`-spørsmål er obligatoriske** for brukerne; `text`-spørsmål er valgfrie. Endring av type kan derfor påvirke om gamle påmeldinger ville blitt validert i dag.
- **Sletting av et spørsmål** kan bryte foreliggende registreringer som lagret svar. Foretrekk å slå av.
- **Svaralternativene deles** mellom alle `select`-spørsmål via [Evalueringssvar](eval-options.md). Hvis du trenger et eget alternativsett per spørsmål, må databasestrukturen endres — be utvikleren.

## Relatert

- [Evalueringssvar](eval-options.md) — svaralternativene for `select`-typen
- [Skjemadata](skemadata.md) — hub-side
