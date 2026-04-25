interface PrivacyPolicyProps {
  onClose: () => void;
}

export function PrivacyPolicy({ onClose }: PrivacyPolicyProps) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between rounded-t-2xl sm:rounded-t-2xl">
          <h2 className="text-base font-bold text-gray-800">Personvernerklæring</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Lukk
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 text-sm text-gray-700 space-y-5">
          <p className="text-xs text-gray-400">Sist oppdatert: april 2025</p>

          <section className="space-y-1.5">
            <h3 className="font-semibold text-gray-800">Hvem er ansvarlig</h3>
            <p>
              Sommerfuglfanger er et hobbyprosjekt. Kontakt:{' '}
              <a
                href="mailto:arnsteinvolden@gmail.com"
                className="text-green-700 underline"
              >
                arnsteinvolden@gmail.com
              </a>
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-semibold text-gray-800">Hvilke opplysninger samles inn</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li><span className="font-medium text-gray-700">Brukernavn</span> — velges av deg, vises offentlig på topplisten</li>
              <li><span className="font-medium text-gray-700">E-postadresse</span> — brukes kun til passordtilbakestilling, vises aldri offentlig</li>
              <li><span className="font-medium text-gray-700">Passord</span> — lagres som en enveis-hash (bcrypt), aldri i klartekst</li>
              <li><span className="font-medium text-gray-700">GPS-posisjon</span> — valgfritt, registreres ved hvert funn for å oppdage juks og vise funnkart. Eksakt posisjon er kun tilgjengelig for appens database; kartet viser kun avrundede koordinater (~1 km nøyaktighet)</li>
              <li><span className="font-medium text-gray-700">Enhetsprodusent og -modell</span> — hentes fra bildes EXIF-metadata dersom tilgjengelig, brukes i autentisitetsvurdering</li>
              <li><span className="font-medium text-gray-700">EXIF-tilstedeværelse</span> — et ja/nei-flagg som angir om det innsendte bildet hadde EXIF-data</li>
            </ul>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-semibold text-gray-800">Hvorfor samles opplysningene inn</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Drive spillet og topplisten</li>
              <li>Oppdage og forhindre juks (anti-cheat)</li>
              <li>Vise anonymisert funnkart over registrerte observasjoner</li>
              <li>Mulighet for passordtilbakestilling via e-post</li>
            </ul>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-semibold text-gray-800">Bilder</h3>
            <p className="text-gray-600">
              Bilder du tar sendes til <span className="font-medium text-gray-700">iNaturalists API</span> for automatisk artsidentifikasjon. Bildet lagres <span className="font-medium">ikke</span> i Sommerfuglfangers database — kun identifikasjonsresultatet (art og konfidens) lagres. iNaturalists egen{' '}
              <a
                href="https://www.inaturalist.org/pages/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-700 underline"
              >
                personvernerklæring
              </a>{' '}
              gjelder for deres behandling av bildet.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-semibold text-gray-800">Tredjeparts tjenester</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li><span className="font-medium text-gray-700">Supabase</span> — database og backend, server i EU</li>
              <li><span className="font-medium text-gray-700">iNaturalist</span> — AI-artsidentifikasjon</li>
              <li><span className="font-medium text-gray-700">OpenStreetMap</span> — kartfliser i funnkartet, ingen persondata deles</li>
            </ul>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-semibold text-gray-800">Lagringstid</h3>
            <p className="text-gray-600">
              Data lagres så lenge brukerkontoen er aktiv. Du kan når som helst be om sletting av kontoen og tilhørende data ved å kontakte oss på e-postadressen over.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-semibold text-gray-800">Dine rettigheter</h3>
            <p className="text-gray-600">
              Du har rett til innsyn i, retting av og sletting av opplysninger vi har om deg. Ta kontakt på e-post for å benytte disse rettighetene.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
