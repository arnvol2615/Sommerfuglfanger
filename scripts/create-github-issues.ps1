param(
  [string]$Repo = "arnvol2615/Sommerfuglfanger"
)

$ErrorActionPreference = "Stop"

function Test-GhAvailable {
  try {
    gh --version | Out-Null
    return $true
  }
  catch {
    return $false
  }
}

if (-not (Test-GhAvailable)) {
  Write-Error "GitHub CLI (gh) er ikke tilgjengelig i PATH. Installer gh og prov igjen."
}

$issues = @(
  @{ Title = "Legg til automatiske tester for hovedflyt"; Labels = "testing,quality,high"; Body = @"
Maal:
Sikre at login, bildeopplasting og registrering av art ikke regressjoner.

Acceptance criteria:
- Minst en test for login med gyldig token-flow (mocked API).
- Minst en test for identifiseringsresultat med bekreftelse av art.
- Minst en test for poengoppdatering ved ny art.
- Testene kjorer i CI.
"@ },
  @{ Title = "Forbedre haandtering av token-feil og utlogging"; Labels = "auth,bug,high"; Body = @"
Maal:
Gi tydeligere feil ved utgaatt eller ugyldig token, og tryggere recovery.

Acceptance criteria:
- Ved 401/403 fra iNaturalist vises klar feilmelding.
- Bruker kan enkelt logge ut og logge inn igjen.
- App havner ikke i fast feiltilstand etter token-feil.
"@ },
  @{ Title = "Fiks lint-feil i eksisterende kode"; Labels = "tech-debt,quality,high"; Body = @"
Maal:
Faa lint pipeline tilbake til green.

Acceptance criteria:
- Ingen ESLint errors ved npm run lint.
- Ingen funksjonelle regresjoner i login og identifisering.
"@ },
  @{ Title = "Legg til offline-ko og retry for bildeanalyse"; Labels = "feature,pwa,medium"; Body = @"
Maal:
Bedre opplevelse ved daarlig nett.

Acceptance criteria:
- Bruker faar tydelig status hvis analyse ikke kan sendes.
- Mislykkede foresporsler kan retryes uten nytt bilde.
- UX viser forskjell paa lokal feil og API-feil.
"@ },
  @{ Title = "Vis historikk over funn med dato og poeng"; Labels = "feature,ux,medium"; Body = @"
Maal:
Gi spilleren motivasjon og oversikt over progresjon.

Acceptance criteria:
- Egen visning for siste funn.
- Hvert funn viser art, tidspunkt og poeng.
- Sortering nyeste forst.
"@ },
  @{ Title = "Bedre filtrering av usikre treff i identifisering"; Labels = "vision,quality,medium"; Body = @"
Maal:
Redusere falske positive treff.

Acceptance criteria:
- Justering av terskel eller regelverk er begrunnet og dokumentert.
- Endring valideres med et lite sett testbilder.
- Ingen svekkelse av hard constraints i AGENTS.
"@ },
  @{ Title = "Introduser feature-flagg for eksperimentelle endringer"; Labels = "architecture,feature,medium"; Body = @"
Maal:
Tryggere utrulling av nye features.

Acceptance criteria:
- Minst ett flagg lest fra VITE_-variabel.
- Default-verdi er trygg.
- Dokumentert i .env.example og README.
"@ },
  @{ Title = "Legg til eksport/import av lokal progresjon"; Labels = "feature,low"; Body = @"
Maal:
La bruker flytte progresjon mellom enheter.

Acceptance criteria:
- Eksporterer gyldig JSON-format.
- Import validerer format og feilhaandterer ugyldig data.
- Eksisterende progresjon overskrives kun etter bekreftelse.
"@ },
  @{ Title = "Legg til achievements for milepaeler"; Labels = "gameplay,feature,low"; Body = @"
Maal:
Skape mer engasjement over tid.

Acceptance criteria:
- Minst tre achievements definert.
- Trigger ved korrekt terskel.
- Synlig i UI.
"@ },
  @{ Title = "Legg til statistikkpanel per familie"; Labels = "analytics,feature,low"; Body = @"
Maal:
Gi bedre innsikt i hva som mangler i samlingen.

Acceptance criteria:
- Viser funn per familie og totalt.
- Viser prosent fullfort per familie.
- Oppdateres i sanntid ved nye funn.
"@ },
  @{ Title = "Sett opp issue templates i GitHub"; Labels = "process,docs,low"; Body = @"
Maal:
Standardisere nye feature- og bug-issues.

Acceptance criteria:
- Minst en template for feature request.
- Minst en template for bug report.
- Template peker til AGENTS og README ved behov.
"@ }
)

foreach ($issue in $issues) {
  Write-Host "Oppretter issue: $($issue.Title)"
  gh issue create --repo $Repo --title $issue.Title --body $issue.Body --label $issue.Labels
}

Write-Host "Ferdig. Alle issues er sendt inn mot $Repo."
