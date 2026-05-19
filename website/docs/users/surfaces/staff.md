---
sidebar_position: 3
---

# Mine tilganger — `/admin/staff`

**Hvem ser dette:** Alle stab-roller
**Krever kapabilitet:** (ingen — siden viser din egen JWT)

![Siden Mine tilganger viser bearer-status, utløpsdato, rå kapabiliteter, og effektiv menytilgang](/img/screenshots/rwg-adm-staff.png)

## Hva siden gjør

Inspiserer JWT-en du er innlogget med. Brukes hovedsakelig til feilsøking — *"hvorfor ser jeg ikke X i sidemenyen?"* — eller for å bekrefte utløpsdato før en demo.

## Hva du ser

Fire kort under hverandre:

- **JWT** — to felt:
  - **Bearer:** «tilgjengelig (økt eller server-fallback)» hvis tokenet kan leses, eller «mangler».
  - **Utløp (`exp`):** dato og klokkeslett i norsk lokalformat. «Ukjent» hvis `exp` mangler.
- **Rå kapabiliteter (JWT)** — liste over strenger som ligger i `capabilities`-arrayet. Eksempel: `["registrations:read", "registrations:write"]`. Tom liste betyr anon-token.
- **Effektiv meny-tilgang** — utvidet kapabilitetssett brukt for å filtrere sidefeltet. Hvis JWT-en din inneholder `admin`, antar Next at du har alle 9 kjente kapabiliteter (sidemeny-nivå). Selve databasen (PostgREST/RLS) gjør egen vurdering på hvert kall.
- **Brukeradministrasjon (`auth.users`)** — informasjonsfelt: skjema `auth` er ikke eksponert gjennom PostgREST i dag. Invitasjoner, passord og tilgangsstyring foregår via UIS, ikke fra Next-appen. Lenke tilbake til [Oversikt](overview.md).

## Vanlige oppgaver

- **Sjekke om JWT er gyldig** — hvis Bearer-status er «mangler» eller utløp er passert, må du logge inn på nytt fra [`/admin/login`](login.md).
- **Verifisere at en spesifikk kapabilitet er med** — hvis Aktiviteter-menyen ikke er synlig, kontroller at `content:read` står i listen «Rå kapabiliteter».
- **Bekrefte rolle før demo** — kort sammenligning av «Rå kapabiliteter» mot forventningene i [Test av dummy-innlogging](../../contributors/testing-dummy-login.md).

## Fallgruver

- **«Klarte ikke å lese capabilities fra token»** — tokenet er enten ugyldig HS256 eller har et ukjent payload-format. Logg inn på nytt; hvis det fortsatt feiler, be utviklerne sjekke `JWT_SECRET`-samsvar.
- **Effektivt sett er større enn rå sett** — det er bevisst, ikke en feil. `admin`-kapabiliteten utvides til alle 9 kjente kapabiliteter for menyformål.
- Siden viser **din** JWT, ikke andres. Det er ingen oversikt over alle stab-konti i appen — den ligger i UIS og databasen.

## Relatert

- [Slik logger du inn](login.md) — for å bytte rolle eller fornye token
- [PostgreSQL-roller](../../contributors/postgres-roles.md) — utviklerforklaring av `anon` / `authenticated` / `authenticator`
