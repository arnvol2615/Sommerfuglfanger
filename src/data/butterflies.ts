export type Family =
  | 'Edelsteiner'
  | 'Blåvinger'
  | 'Hvitvinger'
  | 'Riddersommerfugler'
  | 'Bredvinger';

export type RedListCategory = 'CR' | 'EN' | 'VU' | 'NT' | 'LC' | 'DD' | 'NA' | 'NE';
export type Rarity = 'Svaert sjelden' | 'Sjelden' | 'Uvanlig' | 'Vanlig';

export interface Species {
  id: string;
  name_no: string;
  name_sci: string;
  family: Family;
  inatTaxonId: number;
  adbTaxonId: number;
  redlistCategory: RedListCategory;
  rarity: Rarity;
}

export const FAMILIES: { id: Family; name: string; icon: string }[] = [
  { id: 'Edelsteiner', name: 'Edelsteiner (Nymphalidae)', icon: '🦋' },
  { id: 'Blåvinger', name: 'Blåvinger (Lycaenidae)', icon: '💙' },
  { id: 'Hvitvinger', name: 'Hvitvinger (Pieridae)', icon: '🤍' },
  { id: 'Riddersommerfugler', name: 'Riddersommerfugler (Papilionidae)', icon: '👑' },
  { id: 'Bredvinger', name: 'Bredvinger (Hesperiidae)', icon: '🌿' },
];

const REDLIST_CATEGORY_BY_SCI_NAME: Record<string, RedListCategory> = {
  'aglais io': 'LC',
  'aglais urticae': 'LC',
  'agriades aquilo': 'LC',
  'agriades glandon': 'LC',
  'anthocharis cardamines': 'LC',
  'apatura iris': 'NA',
  'aphantopus hyperantus': 'LC',
  'araschnia levana': 'NA',
  'argynnis paphia': 'LC',
  'aricia artaxerxes': 'LC',
  'boloria aquilonaris': 'LC',
  'boloria euphrosyne': 'LC',
  'boloria freija': 'LC',
  'boloria frigga': 'LC',
  'boloria selene': 'LC',
  'brenthis ino': 'LC',
  'callophrys rubi': 'LC',
  'carterocephalus palaemon': 'LC',
  'celastrina argiolus': 'LC',
  'coenonympha pamphilus': 'LC',
  'coenonympha tullia': 'LC',
  'colias hecla': 'LC',
  'colias nastes': 'LC',
    'colias palaeno': 'LC',
  'cupido minimus': 'LC',
  'erebia disa': 'LC',
  'erebia embla': 'LC',
  'erebia ligea': 'LC',
  'erynnis tages': 'LC',
  'euphydryas iduna': 'LC',
  'favonius quercus': 'LC',
  'gonepteryx rhamni': 'LC',
  'hesperia comma': 'LC',
  'lasiommata maera': 'LC',
  'lasiommata megera': 'LC',
  'leptidea juvernica': 'LC',
  'leptidea sinapis': 'LC',
  'limenitis populi': 'LC',
  'lycaena hippothoe': 'LC',
  'lycaena phlaeas': 'LC',
  'lycaena virgaureae': 'LC',
  'maniola jurtina': 'LC',
  'melitaea athalia': 'LC',
  'melitaea cinxia': 'CR',
  'melitaea diamina': 'VU',
  'nymphalis antiopa': 'LC',
  'nymphalis c-album': 'LC',
  'nymphalis polychloros': 'NA',
  'ochlodes sylvanus': 'LC',
  'oeneis bore': 'LC',
  'oeneis jutta': 'LC',
  'oeneis norna': 'LC',
  'papilio machaon': 'LC',
  'pararge aegeria': 'LC',
  'parnassius apollo': 'NT',
  'parnassius mnemosyne': 'NT',
  'pieris brassicae': 'LC',
  'pieris napi': 'LC',
  'pieris rapae': 'LC',
  'plebejus argus': 'LC',
  'plebejus idas': 'LC',
  'polygonia c-album': 'LC',
  'polyommatus icarus': 'LC',
  'pontia edusa': 'NA',
  'pyrgus centaureae': 'LC',
  'pyrgus malvae': 'LC',
  'thecla betulae': 'LC',
  'thymelicus lineola': 'LC',
  'vanessa atalanta': 'LC',
  'vanessa cardui': 'LC',
};

function toRarity(category: RedListCategory): Rarity {
  if (category === 'CR' || category === 'EN' || category === 'VU') return 'Svaert sjelden';
  if (category === 'NT') return 'Sjelden';
  if (category === 'LC') return 'Vanlig';
  return 'Uvanlig';
}

const BASE_SPECIES: Omit<Species, 'redlistCategory' | 'rarity'>[] = [
  // Edelsteiner / Nymphalidae
  { id: 'aglais-urticae', name_no: 'Neslesommerfugl', name_sci: 'Aglais urticae', family: 'Edelsteiner', inatTaxonId: 55626, adbTaxonId: 29854 },
  { id: 'aglais-io', name_no: 'Dagpåfuglsøye', name_sci: 'Aglais io', family: 'Edelsteiner', inatTaxonId: 55619, adbTaxonId: 29853 },
  { id: 'vanessa-atalanta', name_no: 'Admiralsommerfugl', name_sci: 'Vanessa atalanta', family: 'Edelsteiner', inatTaxonId: 49133, adbTaxonId: 29857 },
  { id: 'vanessa-cardui', name_no: 'Tistelsommerfugl', name_sci: 'Vanessa cardui', family: 'Edelsteiner', inatTaxonId: 49134, adbTaxonId: 29858 },
  { id: 'polygonia-c-album', name_no: 'Hvit c', name_sci: 'Polygonia c-album', family: 'Edelsteiner', inatTaxonId: 56577, adbTaxonId: 29856 },
  { id: 'nymphalis-polychloros', name_no: 'Kirsebærsommerfugl', name_sci: 'Nymphalis polychloros', family: 'Edelsteiner', inatTaxonId: 55646, adbTaxonId: 29855 },
  { id: 'nymphalis-antiopa', name_no: 'Sørgekåpe', name_sci: 'Nymphalis antiopa', family: 'Edelsteiner', inatTaxonId: 55643, adbTaxonId: 29852 },
  { id: 'nymphalis-c-album', name_no: 'Hvit c', name_sci: 'Nymphalis c-album', family: 'Edelsteiner', inatTaxonId: 56577, adbTaxonId: 29856 },
  { id: 'araschnia-levana', name_no: 'Kartasommerfugl', name_sci: 'Araschnia levana', family: 'Edelsteiner', inatTaxonId: 62928, adbTaxonId: 29859 },
  { id: 'argynnis-paphia', name_no: 'Keiserkåpe', name_sci: 'Argynnis paphia', family: 'Edelsteiner', inatTaxonId: 60759, adbTaxonId: 29871 },
  { id: 'argynnis-aglaja', name_no: 'Grønnflekket perlemorssommerfugl', name_sci: 'Argynnis aglaja', family: 'Edelsteiner', inatTaxonId: 60748, adbTaxonId: 29868 },
  { id: 'argynnis-adippe', name_no: 'Stor perlemorssommerfugl', name_sci: 'Argynnis adippe', family: 'Edelsteiner', inatTaxonId: 60746, adbTaxonId: 29867 },
  { id: 'argynnis-niobe', name_no: 'Niobe-perlemorssommerfugl', name_sci: 'Argynnis niobe', family: 'Edelsteiner', inatTaxonId: 60756, adbTaxonId: 29869 },
  { id: 'brenthis-ino', name_no: 'Engsommerfugl', name_sci: 'Brenthis ino', family: 'Edelsteiner', inatTaxonId: 61161, adbTaxonId: 29877 },
  { id: 'boloria-selene', name_no: 'Liten perlemorssommerfugl', name_sci: 'Boloria selene', family: 'Edelsteiner', inatTaxonId: 61138, adbTaxonId: 29879 },
  { id: 'boloria-euphrosyne', name_no: 'Freyjas perlemorssommerfugl', name_sci: 'Boloria euphrosyne', family: 'Edelsteiner', inatTaxonId: 61131, adbTaxonId: 29878 },
  { id: 'boloria-aquilonaris', name_no: 'Myrperlemorssommerfugl', name_sci: 'Boloria aquilonaris', family: 'Edelsteiner', inatTaxonId: 61127, adbTaxonId: 29880 },
  { id: 'boloria-frigga', name_no: 'Friggas perlemorssommerfugl', name_sci: 'Boloria frigga', family: 'Edelsteiner', inatTaxonId: 61132, adbTaxonId: 29882 },
  { id: 'boloria-freija', name_no: 'Frejas perlemorssommerfugl', name_sci: 'Boloria freija', family: 'Edelsteiner', inatTaxonId: 61130, adbTaxonId: 29881 },
  { id: 'boloria-impromissa', name_no: 'Nordlig perlemorssommerfugl', name_sci: 'Boloria impromissa', family: 'Edelsteiner', inatTaxonId: 61133, adbTaxonId: 29883 },
  { id: 'euphydryas-iduna', name_no: 'Myrruteflekksommerfugl', name_sci: 'Euphydryas iduna', family: 'Edelsteiner', inatTaxonId: 62880, adbTaxonId: 29890 },
  { id: 'melitaea-cinxia', name_no: 'Veronika-ruteflekksommerfugl', name_sci: 'Melitaea cinxia', family: 'Edelsteiner', inatTaxonId: 62994, adbTaxonId: 29891 },
  { id: 'melitaea-athalia', name_no: 'Brun ruteflekksommerfugl', name_sci: 'Melitaea athalia', family: 'Edelsteiner', inatTaxonId: 62985, adbTaxonId: 29893 },
  { id: 'melitaea-diamina', name_no: 'Svart ruteflekksommerfugl', name_sci: 'Melitaea diamina', family: 'Edelsteiner', inatTaxonId: 62990, adbTaxonId: 29892 },
  { id: 'limenitis-populi', name_no: 'Ospesommerfugl', name_sci: 'Limenitis populi', family: 'Edelsteiner', inatTaxonId: 62934, adbTaxonId: 29865 },
  { id: 'apatura-iris', name_no: 'Stokkonsul', name_sci: 'Apatura iris', family: 'Edelsteiner', inatTaxonId: 60563, adbTaxonId: 29863 },
  { id: 'lasiommata-megera', name_no: 'Muroksesommerfugl', name_sci: 'Lasiommata megera', family: 'Edelsteiner', inatTaxonId: 56906, adbTaxonId: 29907 },
  { id: 'lasiommata-maera', name_no: 'Bjørkoksesommerfugl', name_sci: 'Lasiommata maera', family: 'Edelsteiner', inatTaxonId: 56903, adbTaxonId: 29906 },
  { id: 'pararge-aegeria', name_no: 'Mosaikkoksesommerfugl', name_sci: 'Pararge aegeria', family: 'Edelsteiner', inatTaxonId: 57348, adbTaxonId: 29905 },
  { id: 'coenonympha-pamphilus', name_no: 'Liten engvinge', name_sci: 'Coenonympha pamphilus', family: 'Edelsteiner', inatTaxonId: 56666, adbTaxonId: 29912 },
  { id: 'coenonympha-tullia', name_no: 'Stor engvinge', name_sci: 'Coenonympha tullia', family: 'Edelsteiner', inatTaxonId: 56669, adbTaxonId: 29913 },
  { id: 'aphantopus-hyperantus', name_no: 'Ringvinge', name_sci: 'Aphantopus hyperantus', family: 'Edelsteiner', inatTaxonId: 56562, adbTaxonId: 29914 },
  { id: 'maniola-jurtina', name_no: 'Brunøye', name_sci: 'Maniola jurtina', family: 'Edelsteiner', inatTaxonId: 57075, adbTaxonId: 29915 },
  { id: 'erebia-ligea', name_no: 'Skogsommerfugl', name_sci: 'Erebia ligea', family: 'Edelsteiner', inatTaxonId: 56815, adbTaxonId: 29916 },
  { id: 'erebia-euryale', name_no: 'Fjellsommerfugl', name_sci: 'Erebia euryale', family: 'Edelsteiner', inatTaxonId: 56811, adbTaxonId: 29917 },
  { id: 'erebia-embla', name_no: 'Myrsommerfugl', name_sci: 'Erebia embla', family: 'Edelsteiner', inatTaxonId: 56809, adbTaxonId: 29918 },
  { id: 'erebia-disa', name_no: 'Alpesommerfugl', name_sci: 'Erebia disa', family: 'Edelsteiner', inatTaxonId: 56807, adbTaxonId: 29920 },
  { id: 'oeneis-jutta', name_no: 'Torvmyrsommerfugl', name_sci: 'Oeneis jutta', family: 'Edelsteiner', inatTaxonId: 57296, adbTaxonId: 29921 },
  { id: 'oeneis-bore', name_no: 'Nordsommerfugl', name_sci: 'Oeneis bore', family: 'Edelsteiner', inatTaxonId: 57283, adbTaxonId: 29922 },
  { id: 'oeneis-norna', name_no: 'Nornasommerfugl', name_sci: 'Oeneis norna', family: 'Edelsteiner', inatTaxonId: 57293, adbTaxonId: 29923 },

  // Blåvinger / Lycaenidae
  { id: 'lycaena-phlaeas', name_no: 'Lille ildfugl', name_sci: 'Lycaena phlaeas', family: 'Blåvinger', inatTaxonId: 84629, adbTaxonId: 29770 },
  { id: 'lycaena-hippothoe', name_no: 'Fiolett ildfugl', name_sci: 'Lycaena hippothoe', family: 'Blåvinger', inatTaxonId: 84624, adbTaxonId: 29772 },
  { id: 'lycaena-virgaureae', name_no: 'Gullildfugl', name_sci: 'Lycaena virgaureae', family: 'Blåvinger', inatTaxonId: 84633, adbTaxonId: 29773 },
  { id: 'thecla-betulae', name_no: 'Slåpetornstjertvinge', name_sci: 'Thecla betulae', family: 'Blåvinger', inatTaxonId: 84897, adbTaxonId: 29821 },
  { id: 'callophrys-rubi', name_no: 'Grønn stjertvinge', name_sci: 'Callophrys rubi', family: 'Blåvinger', inatTaxonId: 84162, adbTaxonId: 29823 },
  { id: 'favonius-quercus', name_no: 'Eikestjertvinge', name_sci: 'Favonius quercus', family: 'Blåvinger', inatTaxonId: 84464, adbTaxonId: 29822 },
  { id: 'cupido-minimus', name_no: 'Dvergblåvinge', name_sci: 'Cupido minimus', family: 'Blåvinger', inatTaxonId: 84392, adbTaxonId: 29787 },
  { id: 'everes-argiades', name_no: 'Kortstjertet blåvinge', name_sci: 'Everes argiades', family: 'Blåvinger', inatTaxonId: 84457, adbTaxonId: 29788 },
  { id: 'celastrina-argiolus', name_no: 'Hullblåvinge', name_sci: 'Celastrina argiolus', family: 'Blåvinger', inatTaxonId: 84194, adbTaxonId: 29789 },
  { id: 'plebejus-argus', name_no: 'Sølvblåvinge', name_sci: 'Plebejus argus', family: 'Blåvinger', inatTaxonId: 84768, adbTaxonId: 29790 },
  { id: 'plebejus-idas', name_no: 'Idasblåvinge', name_sci: 'Plebejus idas', family: 'Blåvinger', inatTaxonId: 84769, adbTaxonId: 29791 },
  { id: 'aricia-artaxerxes', name_no: 'Sankthansblåvinge', name_sci: 'Aricia artaxerxes', family: 'Blåvinger', inatTaxonId: 84102, adbTaxonId: 29796 },
  { id: 'polyommatus-icarus', name_no: 'Vanlig blåvinge', name_sci: 'Polyommatus icarus', family: 'Blåvinger', inatTaxonId: 84793, adbTaxonId: 29806 },
  { id: 'agriades-aquilo', name_no: 'Polarblåvinge', name_sci: 'Agriades aquilo', family: 'Blåvinger', inatTaxonId: 84065, adbTaxonId: 29810 },
  { id: 'agriades-glandon', name_no: 'Alpeblåvinge', name_sci: 'Agriades glandon', family: 'Blåvinger', inatTaxonId: 84067, adbTaxonId: 29811 },

  // Hvitvinger / Pieridae
  { id: 'pieris-brassicae', name_no: 'Stor kålsommerfugl', name_sci: 'Pieris brassicae', family: 'Hvitvinger', inatTaxonId: 55846, adbTaxonId: 29739 },
  { id: 'pieris-rapae', name_no: 'Liten kålsommerfugl', name_sci: 'Pieris rapae', family: 'Hvitvinger', inatTaxonId: 55849, adbTaxonId: 29740 },
  { id: 'pieris-napi', name_no: 'Rapssommerfugl', name_sci: 'Pieris napi', family: 'Hvitvinger', inatTaxonId: 55848, adbTaxonId: 29741 },
  { id: 'pieris-dulcinea', name_no: 'Grønnåre-kålsommerfugl', name_sci: 'Pieris dulcinea', family: 'Hvitvinger', inatTaxonId: 55843, adbTaxonId: 29742 },
  { id: 'pontia-edusa', name_no: 'Sjeldnere hvit', name_sci: 'Pontia edusa', family: 'Hvitvinger', inatTaxonId: 55856, adbTaxonId: 29744 },
  { id: 'anthocharis-cardamines', name_no: 'Aurorasommerfugl', name_sci: 'Anthocharis cardamines', family: 'Hvitvinger', inatTaxonId: 55686, adbTaxonId: 29748 },
  { id: 'colias-palaeno', name_no: 'Myrgulvinge', name_sci: 'Colias palaeno', family: 'Hvitvinger', inatTaxonId: 56142, adbTaxonId: 29756 },
  { id: 'colias-hecla', name_no: 'Polarlysgulvinge', name_sci: 'Colias hecla', family: 'Hvitvinger', inatTaxonId: 56133, adbTaxonId: 29757 },
  { id: 'colias-nastes', name_no: 'Nordlandsgulvinge', name_sci: 'Colias nastes', family: 'Hvitvinger', inatTaxonId: 56139, adbTaxonId: 29758 },
  { id: 'colias-hyale', name_no: 'Blekgul perlemorvinge', name_sci: 'Colias hyale', family: 'Hvitvinger', inatTaxonId: 56134, adbTaxonId: 29754 },
  { id: 'gonepteryx-rhamni', name_no: 'Sitronsommerfugl', name_sci: 'Gonepteryx rhamni', family: 'Hvitvinger', inatTaxonId: 55708, adbTaxonId: 29761 },
  { id: 'leptidea-sinapis', name_no: 'Hvit engvinge', name_sci: 'Leptidea sinapis', family: 'Hvitvinger', inatTaxonId: 55750, adbTaxonId: 29735 },
  { id: 'leptidea-juvernica', name_no: 'Irsk hvit engvinge', name_sci: 'Leptidea juvernica', family: 'Hvitvinger', inatTaxonId: 55749, adbTaxonId: 29736 },

  // Riddersommerfugler / Papilionidae
  { id: 'papilio-machaon', name_no: 'Svalehalensommerfugl', name_sci: 'Papilio machaon', family: 'Riddersommerfugler', inatTaxonId: 48662, adbTaxonId: 29729 },
  { id: 'iphiclides-podalirius', name_no: 'Seglvinge', name_sci: 'Iphiclides podalirius', family: 'Riddersommerfugler', inatTaxonId: 49005, adbTaxonId: 29730 },
  { id: 'parnassius-apollo', name_no: 'Apollosommerfugl', name_sci: 'Parnassius apollo', family: 'Riddersommerfugler', inatTaxonId: 48798, adbTaxonId: 29755 },
  { id: 'parnassius-mnemosyne', name_no: 'Sorgmantel', name_sci: 'Parnassius mnemosyne', family: 'Riddersommerfugler', inatTaxonId: 48793, adbTaxonId: 30011 },

  // Bredvinger / Hesperiidae
  { id: 'ochlodes-sylvanus', name_no: 'Rustbrun bredvinge', name_sci: 'Ochlodes sylvanus', family: 'Bredvinger', inatTaxonId: 57249, adbTaxonId: 29718 },
  { id: 'thymelicus-sylvestris', name_no: 'Brun bredvinge', name_sci: 'Thymelicus sylvestris', family: 'Bredvinger', inatTaxonId: 57460, adbTaxonId: 29720 },
  { id: 'thymelicus-lineola', name_no: 'Svartbrun bredvinge', name_sci: 'Thymelicus lineola', family: 'Bredvinger', inatTaxonId: 57459, adbTaxonId: 29721 },
  { id: 'hesperia-comma', name_no: 'Kommabredvinge', name_sci: 'Hesperia comma', family: 'Bredvinger', inatTaxonId: 57117, adbTaxonId: 29716 },
  { id: 'carterocephalus-palaemon', name_no: 'Rutterbredvinge', name_sci: 'Carterocephalus palaemon', family: 'Bredvinger', inatTaxonId: 57026, adbTaxonId: 29713 },
  { id: 'erynnis-tages', name_no: 'Mørkbrun bredvinge', name_sci: 'Erynnis tages', family: 'Bredvinger', inatTaxonId: 57066, adbTaxonId: 29714 },
  { id: 'pyrgus-malvae', name_no: 'Jordbærbredvinge', name_sci: 'Pyrgus malvae', family: 'Bredvinger', inatTaxonId: 57394, adbTaxonId: 29715 },
  { id: 'pyrgus-centaureae', name_no: 'Nordlig jordbærbredvinge', name_sci: 'Pyrgus centaureae', family: 'Bredvinger', inatTaxonId: 57381, adbTaxonId: 29710 },
];

export const SPECIES: Species[] = BASE_SPECIES.map(species => {
  const redlistCategory = REDLIST_CATEGORY_BY_SCI_NAME[species.name_sci.toLowerCase()] ?? 'NE';
  return {
    ...species,
    redlistCategory,
    rarity: toRarity(redlistCategory),
  };
});

export const SPECIES_BY_ID = Object.fromEntries(SPECIES.map(s => [s.id, s]));
export const SPECIES_BY_INAT_ID = Object.fromEntries(SPECIES.map(s => [s.inatTaxonId, s]));
