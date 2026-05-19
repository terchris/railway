---
sidebar_position: 11
---

# Skjematekster — `/admin/text-content`

**Hvem ser dette:** Full administrator, Innholdsredaktør
**Krever kapabilitet:** `content:read` (lesing), `content:write` (endring)

![Skjema for redigering av alle tekstfelt som brukes på det offentlige skjemaet](/img/screenshots/rwg-adm-text-content.png)

## Hva siden gjør

Sentral redigeringsside for **alle redaksjonelle tekster** som vises på registreringsskjemaet og takkesiden. Data ligger i én rad i tabellen `railway.text_content`. Andre, mer fokuserte sider ([Aktivitetstekster](activities-text.md)) redigerer en delmengde av samme rad.

## Hva du ser

Skjema gruppert etter avsnitt på det offentlige skjemaet:

- **Forside** — velkomsttekst, intro før registrering starter
- **Aktivitetstrinn** — samme felt som [Aktivitetstekster](activities-text.md)
- **Om deg-trinn** — navn-, e-post-, telefon-, språk-etiketter og hjelpetekster
- **Bekreftelsestrinn** — overskrifter, samtykketekst
- **Takkeside** — to varianter avhengig av om brukeren meldte seg som frivillig eller medlem

Hvert felt vises som et tekstområde eller enlinjes-input. En enkelt lagre-knapp lagrer hele settet.

## Vanlige oppgaver

- **Justere språkbruk fra «medlem» til «bidragsyter»** — søk gjennom alle felt med Ctrl/Cmd+F og oppdater.
- **Legge til en juridisk linje under samtykkeboksen** — rediger feltet for samtykketekst, lagre.
- **Tilpasse takkeside for medlemskap-flow** — rediger den medlemsspesifikke varianten.

## Fallgruver

- **Markdown-støtte er begrenset eller fraværende** — sjekk det offentlige skjemaet etter lagring; mange felt er ren tekst.
- **Tomme felt kan vise en standardtekst eller bare tom plass** avhengig av feltet. Test alltid på `/` etter endring.
- **Felt som også eksponeres i [Aktivitetstekster](activities-text.md)** kan overskrives derfra. Hvis to redaktører jobber parallelt, vinner siste lagring.

## Relatert

- [Aktivitetstekster](activities-text.md) — kort versjon med kun aktivitetstrinn-feltene
- [Aktiviteter](activities.md) — selve aktivitetslisten som teksten refererer til
- [Skjemadata](skemadata.md) — hub-side over alle innholdssidene
