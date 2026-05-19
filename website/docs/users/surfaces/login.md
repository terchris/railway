---
sidebar_position: 2
---

# Innlogging — `/admin/login`

**Hvem ser dette:** Alle (siden er offentlig — selve innloggingen krever en gyldig JWT eller bootstrap-passord)
**Krever kapabilitet:** (ingen — kapabilitetskrav avhenger av hvilken rolle/token du velger)

![Innloggingssiden med dummy-rollevelger og manuell paste-lenke nedenfor](/img/screenshots/rwg-adm-login.png)

## Hva siden gjør

Inngangen til administrasjonsgrensesnittet. Setter en HttpOnly-cookie med staff-JWT som PostgREST aksepterer i påfølgende kall.

## Hva du ser

Sidene har tre innloggingsveier:

1. **Dummy-rollevelger** (standardvisning) — ferdige profiler du klikker på. Listen viser åtte rader: to greyede PostgreSQL-roller (`railway_owner`, `authenticator`) som ikke kan brukes til økt, og seks som virker (`anon`, **Full admin**, **Registrations admin**, **Content editor**, **App-log viewer**, **Users admin**). Beskrevet i detalj i [Administrasjon](../admin/index.md) og [Test av dummy-innlogging](../../contributors/testing-dummy-login.md).
2. **Manuell JWT-paste** — lenken **«Manuell innlogging (lim inn staff-JWT)»** under velgeren åpner et tekstfelt der du kan lime inn en gyldig HS256-token. Brukes når UIS har gitt deg et token direkte. URL blir `/admin/login?manual=1`.
3. **Automatisk innlogging fra miljø-JWT** (`?auto=1`) — for CI / automatisert smoketesting. Hopper over velgeren og setter cookie direkte fra `POSTGREST_ADMIN_JWT` eller `POSTGREST_STAFF_JWT_UIS`. Ikke synlig for vanlige brukere.

## Vanlige oppgaver

- **Logge inn som full administrator under demo** — klikk **«Full admin»**. Du lander på `/admin` med alle sidemenygrupper.
- **Logge inn med UIS-token** — klikk **«Manuell innlogging»**, lim inn JWT, klikk **«Logg inn»**.
- **Logge ut** — knappen **«Logg ut»** nederst i sidefeltet (når du er innlogget). Eller besøk `/admin/login` med en utløpt cookie.

## Fallgruver

- **«Sett JWT_SECRET i .env»**-banneret — vises hvis serveren ikke har `JWT_SECRET` konfigurert. Hverken dummy-velgeren eller manuell paste virker uten den. Kontakt utviklerne.
- **«Ugyldig eller utløpt staff-JWT.»** ved manuell paste — token-signaturen verifiserer ikke mot `JWT_SECRET`, eller `exp` er passert. Be om en fersk token fra UIS, eller mint en lokal via `node scripts/mint-staff-jwt.mjs` (kun lokal utvikling).
- **Dummy-innlogging er utviklingsstillas**, ikke produksjon-auth. Erstattes med Okta eller Authentik før systemet brukes mot ekte data utenfor demo-miljøer. Se [Project conventions](../../contributors/project-conventions.md#temporary-scaffolding).

## Relatert

- [Mine tilganger](staff.md) — sjekk hva tokenet ditt inneholder etter innlogging
- [Administrasjon — rollevelger](../admin/index.md) — beskrivelse av hver dummy-rolle
- [Test av dummy-innlogging](../../contributors/testing-dummy-login.md) — funksjonell sjekkliste per rolle
