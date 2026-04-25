# GitHub Issues Backlog

Denne fila inneholder forslag til framtidige issues for Sommerfuglfanger.

Brukes som kilde for manuell eller automatisk opprettelse i GitHub.

## Huskelapp

- iNaturalist API token URL: https://www.inaturalist.org/users/api_token

## Prioritet High

### 1) Legg til automatiske tester for hovedflyt
Labels: testing, quality, high

Maal:
Sikre at login, bildeopplasting og registrering av art ikke regressjoner.

Acceptance criteria:
- Minst en test for login med gyldig token-flow (mocked API).
- Minst en test for identifiseringsresultat med bekreftelse av art.
- Minst en test for poengoppdatering ved ny art.
- Testene kjorer i CI.

### 2) Forbedre haandtering av token-feil og utlogging
Labels: auth, bug, high

Maal:
Gi tydeligere feil ved utgaatt eller ugyldig token, og tryggere recovery.

Acceptance criteria:
- Ved 401/403 fra iNaturalist vises klar feilmelding.
- Bruker kan enkelt logge ut og logge inn igjen.
- App havner ikke i fast feiltilstand etter token-feil.

### 3) Fiks lint-feil i eksisterende kode
Labels: tech-debt, quality, high

Maal:
Faa lint pipeline tilbake til green.

Acceptance criteria:
- Ingen ESLint errors ved npm run lint.
- Ingen funksjonelle regresjoner i login og identifisering.

### 13) Haandter utlopende iNaturalist-token automatisk
Labels: auth, vision, high

Maal:
Unngaa nedetid i identify-flyten hvis INAT_API_TOKEN utloeper eller blir ugyldig.

Bakgrunn:
- Dagens identify-flyt er avhengig av en gyldig `INAT_API_TOKEN` i Supabase secrets.
- Hvis token har kort levetid eller roteres, kan brukere faa 401 fra iNaturalist.

Acceptance criteria:
- Feil fra iNaturalist 401 oversettes til tydelig driftsfeil i logg og klientmelding.
- Det finnes dokumentert rutine for token-rotasjon (minimum) eller automatisk refresh (maalbildet).
- Token lagres kun som secret (ikke i frontend, ikke i repo).
- Deploy-checklist inneholder verifisering av gyldig token etter deploy.

### 14) Avklar om iNaturalist API-noekkel kan oppdateres automatisk
Labels: auth, vision, high
Status: AVKLART (2026-04-24)

Maal:
Avklare teknisk og praktisk om `INAT_API_TOKEN` kan fornyes automatisk etter endringene i iNaturalist API-token-flyt.

Bakgrunn:
- iNaturalist forum: https://forum.inaturalist.org/t/api-token-can-no-longer-be-obtained-non-interactively/77160
- Dette kan bety at dagens antakelse om automatisk ikke-interaktiv token-oppdatering ikke lenger er gyldig.

Konklusjon (avklart 2026-04-24):
Automatisk token-refresh er IKKE mulig uten en godkjent OAuth-app fra iNaturalist.

Teknisk forklaring:
- `INAT_API_TOKEN` er en JWT som utloeper etter 24 timer.
- For aa hente ny JWT ikke-interaktivt kreves to steg:
    1. POST /oauth/token med client_id + client_secret + brukernavn + passord -> OAuth access token
    2. GET /users/api_token med OAuth-token -> ny JWT
- Siden 2022 krever iNaturalist manuell godkjenning for aa faa client_id/secret ("app owner").
  Krav: konto minst 2 maaneder gammel + minst 10 forbedrende identifikasjoner siste maaned.
- Det finnes ingen offisiell maate aa kalle /users/api_token direkte med brukernavn+passord.

Anbefalt rutine for manuell token-rotasjon:
1. Aapne https://www.inaturalist.org/users/api_token i nettleser (logg inn som app-brukeren)
2. Kopier JWT-verdien fra JSON-svaret
3. Oppdater Supabase secret: Settings -> Edge Functions -> INAT_API_TOKEN
4. Verifiser at identifikasjon fungerer i appen
5. Trigger: naar 401-feil dukker opp i Supabase Edge Function-logg (se issue #13)

Langsiktig losning:
- Sok om "app owner"-status paa iNaturalist (https://www.inaturalist.org/oauth/app_owner_application)
- Naar godkjent: implementer automatisk refresh via Resource Owner Password-flyt
  og lagre INAT_CLIENT_ID, INAT_CLIENT_SECRET, INAT_USERNAME, INAT_PASSWORD som Supabase secrets.

Acceptance criteria:
- [x] Dokumentert om automatisk token-oppdatering er mulig eller ikke.
- [x] Manuell rotasjonsprosess beskrevet med steg, trigger og ansvar.
- [ ] Oppdater DEPLOYMENT_CHECKLIST.md med verifisering av gyldig token etter deploy.
- [ ] Sok om app owner-status naar kontoen moeter kriteriene.

## Prioritet Medium

### 4) Legg til offline-ko og retry for bildeanalyse
Labels: feature, pwa, medium

Maal:
Bedre opplevelse ved daarlig nett.

Acceptance criteria:
- Bruker faar tydelig status hvis analyse ikke kan sendes.
- Mislykkede foresporsler kan retryes uten nytt bilde.
- UX viser forskjell paa lokal feil og API-feil.

### 5) Vis historikk over funn med dato og poeng
Labels: feature, ux, medium

Maal:
Gi spilleren motivasjon og oversikt over progresjon.

Acceptance criteria:
- Egen visning for siste funn.
- Hvert funn viser art, tidspunkt og poeng.
- Sortering nyeste forst.

### 6) Bedre filtrering av usikre treff i identifisering
Labels: vision, quality, medium

Maal:
Redusere falske positive treff.

Acceptance criteria:
- Justering av terskel eller regelverk er begrunnet og dokumentert.
- Endring valideres med et lite sett testbilder.
- Ingen svekkelse av hard constraints i AGENTS.

### 7) Introduser feature-flagg for eksperimentelle endringer
Labels: architecture, feature, medium

Maal:
Tryggere utrulling av nye features.

Acceptance criteria:
- Minst ett flagg lest fra VITE_-variabel.
- Default-verdi er trygg.
- Dokumentert i .env.example og README.

## Prioritet Low

### 8) Legg til eksport/import av lokal progresjon
Labels: feature, low

Maal:
La bruker flytte progresjon mellom enheter.

Acceptance criteria:
- Eksporterer gyldig JSON-format.
- Import validerer format og feilhaandterer ugyldig data.
- Eksisterende progresjon overskrives kun etter bekreftelse.

### 9) Legg til achievements for milepaeler
Labels: gameplay, feature, low

Maal:
Skape mer engasjement over tid.

Acceptance criteria:
- Minst tre achievements definert.
- Trigger ved korrekt terskel.
- Synlig i UI.

### 10) Legg til statistikkpanel per familie
Labels: analytics, feature, low

Maal:
Gi bedre innsikt i hva som mangler i samlingen.

Acceptance criteria:
- Viser funn per familie og totalt.
- Viser prosent fullfort per familie.
- Oppdateres i sanntid ved nye funn.

### 12) EXIF-sjekk for aa redusere juksing med skjermbilder
Labels: gameplay, quality, low

Maal:
Legg til et ekstra lag mot aa registrere arter ved aa fotografere skjermbilder.

Bakgrunn:
GPS-koordinater er ikke tilstrekkelig som jukse-sjekk fordi WiFi-posisjonering fungerer innendors.
EXIF-metadata (kameramodell, blenderaapning, eksponeringstid) er typisk til stede i ekte kamerabilder men mangler i skjermbilder.

Forslag til implementasjon:
- Bruk biblioteket `exifr` til aa lese EXIF fra opplastet bilde.
- Hvis `Make`, `Model`, `ExposureTime` eller `FNumber` mangler, vis en advarsel til bruker.
- Blokker IKKE registrering -- behandle som en myk advarsel (aerlighetssjekk, ikke hard sperring).
- Logg tilstedevaer/fravaar av EXIF som en del av FoundEntry for fremtidig analyse.

Acceptance criteria:
- Bildet leses med exifr uten aa blokkere confirm-flyten.
- Manglende kamera-EXIF vises som gul advarsel i IdentificationResult eller CatchResultModal.
- FoundEntry lagrer et `hasExif: boolean` felt.
- Ingen ekstra nettverksforesporsler -- kun client-side.

### 11) Sett opp issue templates i GitHub
Labels: process, docs, low

Maal:
Standardisere nye feature- og bug-issues.

Acceptance criteria:
- Minst en template for feature request.
- Minst en template for bug report.
- Template peker til AGENTS og README ved behov.

## Forslag til labels

- feature
- bug
- testing
- quality
- gameplay
- auth
- vision
- pwa
- docs
- tech-debt
- high
- medium
- low
