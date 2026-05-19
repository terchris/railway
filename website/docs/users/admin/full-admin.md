---
sidebar_position: 2
---

# Full administrator — kan alt, ser alt

Full administrator har **alle 9 kapabiliteter** i én rolle. Brukes typisk når en eneste person står for både påmeldingsoppfølging, innholdsredigering og drift — eller når du driver demo og vil se hele systemet.

<video controls width="100%" preload="metadata" poster="/img/screenshots/rwg-adm-overview.png">
  <source src="/img/promo/railway-promo-full-admin.mp4" type="video/mp4" />
  Nettleseren din støtter ikke avspilling av video. Du kan laste den ned: <a href="/img/promo/railway-promo-full-admin.mp4">railway-promo-full-admin.mp4</a>.
</video>

## Slik logger du inn

Åpne `http://<host>/admin/login`. I rollevelgeren klikker du **Full admin**.

![Innloggingssiden med rollevelger — klikk «Full admin»-raden](/img/screenshots/rwg-adm-login.png)

Du lander på `/admin`. Sidemenyen viser **alle seks gruppene**: Oversikt, Registreringer, Utskrift, Aktivitet og skjema, Drift, Konto.

JWT-en din inneholder kapabiliteten `admin`, som Next utvider til alle 9 kjente kapabiliteter for sidemenyfilteret. PostgREST/RLS håndhever de faktiske kapabilitetene ved hvert kall.

## Hva du kan gjøre

### Oversikt

Forsiden med raske tellere (registreringer, app-loggvarsler) og snarveier til innholdsredigering.

→ [Detaljer](../surfaces/overview.md)

### Registreringer

Lese, bekrefte og slette påmeldinger. Eksportere til CSV.

![Listevisning av påmeldte](/img/screenshots/rwg-adm-registrations.png)

→ [Registreringer](../surfaces/registrations.md) · [CSV-eksport](../surfaces/registrations-export.md)

### Utskrift

To utskriftsoptimaliserte sider for fysisk arbeid: manuskript for muntlig gjennomgang, papirskjema for offline-registrering.

→ [Manuskript](../surfaces/print-manuscript.md) · [Papirskjema](../surfaces/print-form.md)

### Aktivitet og skjema

Hovedtyngden av innholdsredigeringen. Aktiviteter, kategorier, antallsgrenser, alle tekstene som vises på det offentlige skjemaet, og oppslagsdata som språk, medlemskap, evaluering.

![Liste over aktiviteter gruppert etter kategori](/img/screenshots/rwg-adm-activities.png)

→ [Aktiviteter](../surfaces/activities.md) · [Tilleggsaktiviteter](../surfaces/additional-activities.md) · [Skjematekster](../surfaces/text-content.md) · [Skjemadata](../surfaces/skemadata.md) (hub over evaluering, medlemskap, språk, m.m.)

### Drift

App-loggen. Ser alle systemhendelser, kvitterer åpne varsler.

→ [App-logg](../surfaces/app-log.md)

### Konto

Inspisere din egen JWT — hvilke kapabiliteter, når den utløper.

→ [Mine tilganger](../surfaces/staff.md)

## Hva du **ikke** kan gjøre

Som Full administrator er det få begrensninger fra Railway-appen sin side. Tre ting ligger utenfor:

- **Bruker- og passordadministrasjon** for andre stab-konti — gjøres via UIS i dag, ikke fra denne appen. Se [Mine tilganger](../surfaces/staff.md) for kontekst.
- **Databaseendringer utover redigerbare flater** — DDL og rolledefinisjoner styres av utviklere via repo-en.
- **Endring av kjente kapabiliteter** — listen i `auth.capabilities` er fast for nåværende deployment.

## Relatert

- [Slik logger du inn](../surfaces/login.md)
- [Mine tilganger](../surfaces/staff.md) — bekrefte JWT-status
- [Test av dummy-innlogging](../../contributors/testing-dummy-login.md) — funksjonell sjekkliste hvis du tester systemet
