# GitHub Issues Backlog

Denne fila inneholder forslag til framtidige issues for Sommerfuglfanger.

Brukes som kilde for manuell eller automatisk opprettelse i GitHub.

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
