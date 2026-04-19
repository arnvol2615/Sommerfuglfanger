import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MIN_SCORE = 0.15;

interface Species {
  id: string;
  name_no: string;
  name_sci: string;
  family: string;
  inatTaxonId: number;
  adbTaxonId: number;
  redlistCategory: string;
  rarity: string;
}

// Full species list from butterflies.ts
const SPECIES: Species[] = [
  // Nymfevinger / Nymphalidae
  { id: 'aglais-urticae', name_no: 'Neslesommerfugl', name_sci: 'Aglais urticae', family: 'Nymfevinger', inatTaxonId: 55626, adbTaxonId: 29854, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'aglais-io', name_no: 'Dagpåfuglsøye', name_sci: 'Aglais io', family: 'Nymfevinger', inatTaxonId: 55619, adbTaxonId: 29853, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'vanessa-atalanta', name_no: 'Admiralsommerfugl', name_sci: 'Vanessa atalanta', family: 'Nymfevinger', inatTaxonId: 49133, adbTaxonId: 29857, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'vanessa-cardui', name_no: 'Tistelsommerfugl', name_sci: 'Vanessa cardui', family: 'Nymfevinger', inatTaxonId: 49134, adbTaxonId: 29858, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'polygonia-c-album', name_no: 'Hvit c', name_sci: 'Polygonia c-album', family: 'Nymfevinger', inatTaxonId: 56577, adbTaxonId: 29856, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'nymphalis-antiopa', name_no: 'Sørgekåpe', name_sci: 'Nymphalis antiopa', family: 'Nymfevinger', inatTaxonId: 55643, adbTaxonId: 29852, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'araschnia-levana', name_no: 'Kartasommerfugl', name_sci: 'Araschnia levana', family: 'Nymfevinger', inatTaxonId: 62928, adbTaxonId: 29859, redlistCategory: 'NA', rarity: 'Uvanlig' },
  { id: 'argynnis-paphia', name_no: 'Keiserkåpe', name_sci: 'Argynnis paphia', family: 'Nymfevinger', inatTaxonId: 60759, adbTaxonId: 29871, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'argynnis-aglaja', name_no: 'Grønnflekket perlemorssommerfugl', name_sci: 'Argynnis aglaja', family: 'Nymfevinger', inatTaxonId: 60748, adbTaxonId: 29868, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'argynnis-adippe', name_no: 'Stor perlemorssommerfugl', name_sci: 'Argynnis adippe', family: 'Nymfevinger', inatTaxonId: 60746, adbTaxonId: 29867, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'argynnis-niobe', name_no: 'Niobe-perlemorssommerfugl', name_sci: 'Argynnis niobe', family: 'Nymfevinger', inatTaxonId: 60756, adbTaxonId: 29869, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'brenthis-ino', name_no: 'Engsommerfugl', name_sci: 'Brenthis ino', family: 'Nymfevinger', inatTaxonId: 61161, adbTaxonId: 29877, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'boloria-selene', name_no: 'Liten perlemorssommerfugl', name_sci: 'Boloria selene', family: 'Nymfevinger', inatTaxonId: 61138, adbTaxonId: 29879, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'boloria-euphrosyne', name_no: 'Freyjas perlemorssommerfugl', name_sci: 'Boloria euphrosyne', family: 'Nymfevinger', inatTaxonId: 61131, adbTaxonId: 29878, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'boloria-aquilonaris', name_no: 'Myrperlemorssommerfugl', name_sci: 'Boloria aquilonaris', family: 'Nymfevinger', inatTaxonId: 61127, adbTaxonId: 29880, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'boloria-frigga', name_no: 'Friggas perlemorssommerfugl', name_sci: 'Boloria frigga', family: 'Nymfevinger', inatTaxonId: 61132, adbTaxonId: 29882, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'boloria-freija', name_no: 'Frejas perlemorssommerfugl', name_sci: 'Boloria freija', family: 'Nymfevinger', inatTaxonId: 61130, adbTaxonId: 29881, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'boloria-impromissa', name_no: 'Nordlig perlemorssommerfugl', name_sci: 'Boloria impromissa', family: 'Nymfevinger', inatTaxonId: 61133, adbTaxonId: 29883, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'euphydryas-iduna', name_no: 'Myrruteflekksommerfugl', name_sci: 'Euphydryas iduna', family: 'Nymfevinger', inatTaxonId: 62880, adbTaxonId: 29890, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'melitaea-cinxia', name_no: 'Veronika-ruteflekksommerfugl', name_sci: 'Melitaea cinxia', family: 'Nymfevinger', inatTaxonId: 62994, adbTaxonId: 29891, redlistCategory: 'CR', rarity: 'Svaert sjelden' },
  { id: 'melitaea-athalia', name_no: 'Brun ruteflekksommerfugl', name_sci: 'Melitaea athalia', family: 'Nymfevinger', inatTaxonId: 62985, adbTaxonId: 29893, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'melitaea-diamina', name_no: 'Svart ruteflekksommerfugl', name_sci: 'Melitaea diamina', family: 'Nymfevinger', inatTaxonId: 62990, adbTaxonId: 29892, redlistCategory: 'VU', rarity: 'Svaert sjelden' },
  { id: 'limenitis-populi', name_no: 'Ospesommerfugl', name_sci: 'Limenitis populi', family: 'Nymfevinger', inatTaxonId: 62934, adbTaxonId: 29865, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'apatura-iris', name_no: 'Stokkonsul', name_sci: 'Apatura iris', family: 'Nymfevinger', inatTaxonId: 60563, adbTaxonId: 29863, redlistCategory: 'NA', rarity: 'Uvanlig' },
  { id: 'lasiommata-megera', name_no: 'Muroksesommerfugl', name_sci: 'Lasiommata megera', family: 'Nymfevinger', inatTaxonId: 56906, adbTaxonId: 29907, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'lasiommata-maera', name_no: 'Bjørkoksesommerfugl', name_sci: 'Lasiommata maera', family: 'Nymfevinger', inatTaxonId: 56903, adbTaxonId: 29906, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'pararge-aegeria', name_no: 'Mosaikkoksesommerfugl', name_sci: 'Pararge aegeria', family: 'Nymfevinger', inatTaxonId: 57348, adbTaxonId: 29905, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'coenonympha-pamphilus', name_no: 'Liten engvinge', name_sci: 'Coenonympha pamphilus', family: 'Nymfevinger', inatTaxonId: 56666, adbTaxonId: 29912, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'coenonympha-tullia', name_no: 'Stor engvinge', name_sci: 'Coenonympha tullia', family: 'Nymfevinger', inatTaxonId: 56669, adbTaxonId: 29913, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'aphantopus-hyperantus', name_no: 'Ringvinge', name_sci: 'Aphantopus hyperantus', family: 'Nymfevinger', inatTaxonId: 56562, adbTaxonId: 29914, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'maniola-jurtina', name_no: 'Brunøye', name_sci: 'Maniola jurtina', family: 'Nymfevinger', inatTaxonId: 57075, adbTaxonId: 29915, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'erebia-ligea', name_no: 'Skogsommerfugl', name_sci: 'Erebia ligea', family: 'Nymfevinger', inatTaxonId: 56815, adbTaxonId: 29916, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'erebia-euryale', name_no: 'Fjellsommerfugl', name_sci: 'Erebia euryale', family: 'Nymfevinger', inatTaxonId: 56811, adbTaxonId: 29917, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'erebia-embla', name_no: 'Myrsommerfugl', name_sci: 'Erebia embla', family: 'Nymfevinger', inatTaxonId: 56809, adbTaxonId: 29918, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'erebia-disa', name_no: 'Alpesommerfugl', name_sci: 'Erebia disa', family: 'Nymfevinger', inatTaxonId: 56807, adbTaxonId: 29920, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'oeneis-jutta', name_no: 'Torvmyrsommerfugl', name_sci: 'Oeneis jutta', family: 'Nymfevinger', inatTaxonId: 57296, adbTaxonId: 29921, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'oeneis-bore', name_no: 'Nordsommerfugl', name_sci: 'Oeneis bore', family: 'Nymfevinger', inatTaxonId: 57283, adbTaxonId: 29922, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'oeneis-norna', name_no: 'Nornasommerfugl', name_sci: 'Oeneis norna', family: 'Nymfevinger', inatTaxonId: 57293, adbTaxonId: 29923, redlistCategory: 'LC', rarity: 'Vanlig' },
  // Glansvinger / Lycaenidae
  { id: 'lycaena-phlaeas', name_no: 'Lille ildfugl', name_sci: 'Lycaena phlaeas', family: 'Glansvinger', inatTaxonId: 84629, adbTaxonId: 29770, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'lycaena-hippothoe', name_no: 'Fiolett ildfugl', name_sci: 'Lycaena hippothoe', family: 'Glansvinger', inatTaxonId: 84624, adbTaxonId: 29772, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'lycaena-virgaureae', name_no: 'Gullildfugl', name_sci: 'Lycaena virgaureae', family: 'Glansvinger', inatTaxonId: 84633, adbTaxonId: 29773, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'thecla-betulae', name_no: 'Slåpetornstjertvinge', name_sci: 'Thecla betulae', family: 'Glansvinger', inatTaxonId: 84897, adbTaxonId: 29821, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'callophrys-rubi', name_no: 'Grønn stjertvinge', name_sci: 'Callophrys rubi', family: 'Glansvinger', inatTaxonId: 84162, adbTaxonId: 29823, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'favonius-quercus', name_no: 'Eikestjertvinge', name_sci: 'Favonius quercus', family: 'Glansvinger', inatTaxonId: 84464, adbTaxonId: 29822, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'cupido-minimus', name_no: 'Dvergblåvinge', name_sci: 'Cupido minimus', family: 'Glansvinger', inatTaxonId: 84392, adbTaxonId: 29787, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'everes-argiades', name_no: 'Kortstjertet blåvinge', name_sci: 'Everes argiades', family: 'Glansvinger', inatTaxonId: 84457, adbTaxonId: 29788, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'celastrina-argiolus', name_no: 'Hullblåvinge', name_sci: 'Celastrina argiolus', family: 'Glansvinger', inatTaxonId: 84194, adbTaxonId: 29789, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'plebejus-argus', name_no: 'Sølvblåvinge', name_sci: 'Plebejus argus', family: 'Glansvinger', inatTaxonId: 84768, adbTaxonId: 29790, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'plebejus-idas', name_no: 'Idasblåvinge', name_sci: 'Plebejus idas', family: 'Glansvinger', inatTaxonId: 84769, adbTaxonId: 29791, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'aricia-artaxerxes', name_no: 'Sankthansblåvinge', name_sci: 'Aricia artaxerxes', family: 'Glansvinger', inatTaxonId: 84102, adbTaxonId: 29796, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'polyommatus-icarus', name_no: 'Vanlig blåvinge', name_sci: 'Polyommatus icarus', family: 'Glansvinger', inatTaxonId: 84793, adbTaxonId: 29806, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'agriades-aquilo', name_no: 'Polarblåvinge', name_sci: 'Agriades aquilo', family: 'Glansvinger', inatTaxonId: 84065, adbTaxonId: 29810, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'agriades-glandon', name_no: 'Alpeblåvinge', name_sci: 'Agriades glandon', family: 'Glansvinger', inatTaxonId: 84067, adbTaxonId: 29811, redlistCategory: 'LC', rarity: 'Vanlig' },
  // Hvitvinger / Pieridae
  { id: 'pieris-brassicae', name_no: 'Stor kålsommerfugl', name_sci: 'Pieris brassicae', family: 'Hvitvinger', inatTaxonId: 55846, adbTaxonId: 29739, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'pieris-rapae', name_no: 'Liten kålsommerfugl', name_sci: 'Pieris rapae', family: 'Hvitvinger', inatTaxonId: 55849, adbTaxonId: 29740, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'pieris-napi', name_no: 'Rapssommerfugl', name_sci: 'Pieris napi', family: 'Hvitvinger', inatTaxonId: 55848, adbTaxonId: 29741, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'pieris-dulcinea', name_no: 'Grønnåre-kålsommerfugl', name_sci: 'Pieris dulcinea', family: 'Hvitvinger', inatTaxonId: 55843, adbTaxonId: 29742, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'pontia-edusa', name_no: 'Sjeldnere hvit', name_sci: 'Pontia edusa', family: 'Hvitvinger', inatTaxonId: 55856, adbTaxonId: 29744, redlistCategory: 'NA', rarity: 'Uvanlig' },
  { id: 'anthocharis-cardamines', name_no: 'Aurorasommerfugl', name_sci: 'Anthocharis cardamines', family: 'Hvitvinger', inatTaxonId: 55686, adbTaxonId: 29748, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'colias-palaeno', name_no: 'Myrgulvinge', name_sci: 'Colias palaeno', family: 'Hvitvinger', inatTaxonId: 56142, adbTaxonId: 29756, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'colias-hecla', name_no: 'Polarlysgulvinge', name_sci: 'Colias hecla', family: 'Hvitvinger', inatTaxonId: 56133, adbTaxonId: 29757, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'colias-nastes', name_no: 'Nordlandsgulvinge', name_sci: 'Colias nastes', family: 'Hvitvinger', inatTaxonId: 56139, adbTaxonId: 29758, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'colias-hyale', name_no: 'Blekgul perlemorvinge', name_sci: 'Colias hyale', family: 'Hvitvinger', inatTaxonId: 56134, adbTaxonId: 29754, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'gonepteryx-rhamni', name_no: 'Sitronsommerfugl', name_sci: 'Gonepteryx rhamni', family: 'Hvitvinger', inatTaxonId: 55708, adbTaxonId: 29761, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'leptidea-sinapis', name_no: 'Hvit engvinge', name_sci: 'Leptidea sinapis', family: 'Hvitvinger', inatTaxonId: 55750, adbTaxonId: 29735, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'leptidea-juvernica', name_no: 'Irsk hvit engvinge', name_sci: 'Leptidea juvernica', family: 'Hvitvinger', inatTaxonId: 55749, adbTaxonId: 29736, redlistCategory: 'LC', rarity: 'Vanlig' },
  // Svalestjerter / Papilionidae
  { id: 'papilio-machaon', name_no: 'Svalehalensommerfugl', name_sci: 'Papilio machaon', family: 'Svalestjerter', inatTaxonId: 48662, adbTaxonId: 29729, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'iphiclides-podalirius', name_no: 'Seglvinge', name_sci: 'Iphiclides podalirius', family: 'Svalestjerter', inatTaxonId: 49005, adbTaxonId: 29730, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'parnassius-apollo', name_no: 'Apollosommerfugl', name_sci: 'Parnassius apollo', family: 'Svalestjerter', inatTaxonId: 48798, adbTaxonId: 29755, redlistCategory: 'NT', rarity: 'Sjelden' },
  { id: 'parnassius-mnemosyne', name_no: 'Sorgmantel', name_sci: 'Parnassius mnemosyne', family: 'Svalestjerter', inatTaxonId: 48793, adbTaxonId: 30011, redlistCategory: 'NT', rarity: 'Sjelden' },
  // Smygere / Hesperiidae
  { id: 'ochlodes-sylvanus', name_no: 'Rustbrun bredvinge', name_sci: 'Ochlodes sylvanus', family: 'Smygere', inatTaxonId: 57249, adbTaxonId: 29718, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'thymelicus-sylvestris', name_no: 'Brun bredvinge', name_sci: 'Thymelicus sylvestris', family: 'Smygere', inatTaxonId: 57460, adbTaxonId: 29720, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'thymelicus-lineola', name_no: 'Svartbrun bredvinge', name_sci: 'Thymelicus lineola', family: 'Smygere', inatTaxonId: 57459, adbTaxonId: 29721, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'hesperia-comma', name_no: 'Kommabredvinge', name_sci: 'Hesperia comma', family: 'Smygere', inatTaxonId: 57117, adbTaxonId: 29716, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'carterocephalus-palaemon', name_no: 'Rutterbredvinge', name_sci: 'Carterocephalus palaemon', family: 'Smygere', inatTaxonId: 57026, adbTaxonId: 29713, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'erynnis-tages', name_no: 'Mørkbrun bredvinge', name_sci: 'Erynnis tages', family: 'Smygere', inatTaxonId: 57066, adbTaxonId: 29714, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'pyrgus-malvae', name_no: 'Jordbærbredvinge', name_sci: 'Pyrgus malvae', family: 'Smygere', inatTaxonId: 57394, adbTaxonId: 29715, redlistCategory: 'LC', rarity: 'Vanlig' },
  { id: 'pyrgus-centaureae', name_no: 'Nordlig jordbærbredvinge', name_sci: 'Pyrgus centaureae', family: 'Smygere', inatTaxonId: 57381, adbTaxonId: 29710, redlistCategory: 'LC', rarity: 'Vanlig' },
];

interface VisionResult {
  species: Species;
  score: number;
  inatTaxonId: number;
  inatName: string;
}

// Build lookup maps
const SPECIES_BY_INAT_ID: Record<number, Species> = Object.fromEntries(
  SPECIES.map(s => [s.inatTaxonId, s])
);
const SPECIES_BY_SCI_NAME: Record<string, Species> = Object.fromEntries(
  SPECIES.map(s => [s.name_sci.toLowerCase(), s])
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Auth
  const authHeader = req.headers.get("authorization") ?? "";
  const sessionToken = authHeader.replace("Bearer ", "").trim();

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: session } = await supabase
    .from("sessions")
    .select("user_id, expires_at")
    .eq("token", sessionToken)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (!session) {
    return new Response(JSON.stringify({ error: "Ugyldig eller utløpt sesjon" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Parse multipart form
    console.log('Auth successful, sessionToken start:', authHeader.substring(0, 30));

    let formData;
    try {
      formData = await req.formData();
      console.log('FormData keys:', Array.from(formData.keys()));
    } catch (err) {
      console.error('FormData parsing error:', err);
      return new Response(JSON.stringify({ error: `FormData-parsing feilet: ${err instanceof Error ? err.message : String(err)}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const photo = formData.get("photo") as Blob | null;

    if (!photo) {
      console.error('Photo not found in FormData. Available keys:', Array.from(formData.keys()));
      return new Response(JSON.stringify({ error: "Mangler bilde" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

  // Convert Blob to ArrayBuffer for transmission
  let photoBuffer: ArrayBuffer;
  try {
    photoBuffer = await photo.arrayBuffer();
  } catch {
    return new Response(JSON.stringify({ error: "Kunne ikke lese bilde" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Create FormData for iNaturalist
  const inatForm = new FormData();
  inatForm.append("image", new Blob([photoBuffer], { type: "image/jpeg" }), "photo.jpg");

  // Call iNaturalist with secret token
  const inatToken = Deno.env.get("INAT_API_TOKEN")!;
  let inatData;
  try {
    const inatResp = await fetch("https://api.inaturalist.org/v1/computervision/score_image", {
      method: "POST",
      headers: { Authorization: inatToken },
      body: inatForm,
    });

    if (!inatResp.ok) {
      throw new Error(`iNaturalist error: ${inatResp.status}`);
    }

    inatData = await inatResp.json() as {
      results: Array<{ taxon: { id: number; name: string }; combined_score: number }>;
    };
  } catch (err) {
    return new Response(JSON.stringify({ error: `iNaturalist-feil: ${err instanceof Error ? err.message : String(err)}` }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Match iNaturalist results to Norwegian species
  const results: VisionResult[] = [];
  for (const r of inatData.results) {
    if (r.combined_score < MIN_SCORE) break;
    
    let species = SPECIES_BY_INAT_ID[r.taxon.id];
    if (!species && r.taxon.name) {
      species = SPECIES_BY_SCI_NAME[r.taxon.name.toLowerCase()];
    }
    
    if (species) {
      results.push({
        species,
        score: r.combined_score,
        inatTaxonId: r.taxon.id,
        inatName: r.taxon.name,
      });
    }
    if (results.length >= 3) break;
  }

  // If no match found
  if (results.length === 0) {
    return new Response(
      JSON.stringify({ 
        accepted: false, 
        reason: "Ingen gjenkjennbar sommerfugl",
        results: []
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Return matched species (frontend will pick one to confirm)
  return new Response(
    JSON.stringify({
      accepted: true,
      results: results.map(r => ({
        species: r.species,
        score: r.score,
        inatTaxonId: r.inatTaxonId,
        inatName: r.inatName,
      })),
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});



