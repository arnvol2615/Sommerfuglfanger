export type Family =
  | 'Nymfevinger'
  | 'Glansvinger'
  | 'Hvitvinger'
  | 'Svalestjerter'
  | 'Smygere';

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
  { id: 'Nymfevinger', name: 'Nymfevinger (Nymphalidae)', icon: '🦋' },
  { id: 'Glansvinger', name: 'Glansvinger (Lycaenidae)', icon: '✨' },
  { id: 'Hvitvinger', name: 'Hvitvinger (Pieridae)', icon: '🪽' },
  { id: 'Svalestjerter', name: 'Svalestjerter (Papilionidae)', icon: '🕊️' },
  { id: 'Smygere', name: 'Smygere (Hesperiidae)', icon: '⚡' },
];

const REDLIST_OVERRIDES: Record<string, RedListCategory> = {
  'boloria improba': 'NT',
  'coenonympha hero': 'EN',
  'lycaena helle': 'EN',
  'melitaea cinxia': 'CR',
  'melitaea diamina': 'VU',
  'parnassius apollo': 'NT',
  'parnassius mnemosyne': 'NT',
  'scolitantides orion': 'CR',
  'plebejus argyrognomon': 'CR',
  'aricia nicias': 'EN',
  'pyrgus alveus': 'EN',
  'aporia crataegi': 'EN',
};

function toRarity(category: RedListCategory): Rarity {
  if (category === 'CR' || category === 'EN' || category === 'VU') return 'Svaert sjelden';
  if (category === 'NT') return 'Sjelden';
  if (category === 'LC') return 'Vanlig';
  return 'Uvanlig';
}

const BASE_SPECIES: Omit<Species, 'redlistCategory' | 'rarity'>[] = [
  { id: 'aglais-urticae', name_no: 'Neslesommerfugl', name_sci: 'Aglais urticae', family: 'Nymfevinger', inatTaxonId: 54468, adbTaxonId: 29854 },
  { id: 'aglais-io', name_no: 'Dagpåfugløye', name_sci: 'Aglais io', family: 'Nymfevinger', inatTaxonId: 207977, adbTaxonId: 29852 },
  { id: 'vanessa-atalanta', name_no: 'Admiral', name_sci: 'Vanessa atalanta', family: 'Nymfevinger', inatTaxonId: 49133, adbTaxonId: 29849 },
  { id: 'vanessa-cardui', name_no: 'Tistelsommerfugl', name_sci: 'Vanessa cardui', family: 'Nymfevinger', inatTaxonId: 48548, adbTaxonId: 29850 },
  { id: 'polygonia-c-album', name_no: 'Hvit c', name_sci: 'Polygonia c-album', family: 'Nymfevinger', inatTaxonId: 56225, adbTaxonId: 29856 },
  { id: 'nymphalis-polychloros', name_no: 'Kirsebærsommerfugl', name_sci: 'Nymphalis polychloros', family: 'Nymfevinger', inatTaxonId: 324088, adbTaxonId: 29855 },
  { id: 'nymphalis-antiopa', name_no: 'Sørgekåpe', name_sci: 'Nymphalis antiopa', family: 'Nymfevinger', inatTaxonId: 56832, adbTaxonId: 29853 },
  { id: 'nymphalis-c-album', name_no: 'Hvit c', name_sci: 'Nymphalis c-album', family: 'Nymfevinger', inatTaxonId: 56225, adbTaxonId: 29856 },
  { id: 'araschnia-levana', name_no: 'Kartvinge', name_sci: 'Araschnia levana', family: 'Nymfevinger', inatTaxonId: 55643, adbTaxonId: 95249 },
  { id: 'argynnis-paphia', name_no: 'Keiserkåpe', name_sci: 'Argynnis paphia', family: 'Nymfevinger', inatTaxonId: 123628, adbTaxonId: 29843 },
  { id: 'argynnis-aglaja', name_no: 'Aglajaperlemorvinge', name_sci: 'Argynnis aglaja', family: 'Nymfevinger', inatTaxonId: 1456607, adbTaxonId: 219370 },
  { id: 'argynnis-adippe', name_no: 'Adippeperlemorvinge', name_sci: 'Argynnis adippe', family: 'Nymfevinger', inatTaxonId: 70105, adbTaxonId: 219373 },
  { id: 'argynnis-niobe', name_no: 'Niobeperlemorvinge', name_sci: 'Argynnis niobe', family: 'Nymfevinger', inatTaxonId: 335001, adbTaxonId: 219376 },
  { id: 'brenthis-ino', name_no: 'Engperlemorvinge', name_sci: 'Brenthis ino', family: 'Nymfevinger', inatTaxonId: 334985, adbTaxonId: 29841 },
  { id: 'boloria-selene', name_no: 'Brunflekket perlemorvinge', name_sci: 'Boloria selene', family: 'Nymfevinger', inatTaxonId: 54068, adbTaxonId: 29829 },
  { id: 'boloria-euphrosyne', name_no: 'Rødflekket perlemorvinge', name_sci: 'Boloria euphrosyne', family: 'Nymfevinger', inatTaxonId: 132997, adbTaxonId: 29828 },
  { id: 'boloria-aquilonaris', name_no: 'Myrperlemorvinge', name_sci: 'Boloria aquilonaris', family: 'Nymfevinger', inatTaxonId: 447520, adbTaxonId: 29837 },
  { id: 'boloria-frigga', name_no: 'Friggs perlemorvinge', name_sci: 'Boloria frigga', family: 'Nymfevinger', inatTaxonId: 215290, adbTaxonId: 29834 },
  { id: 'boloria-freija', name_no: 'Frøyas perlemorvinge', name_sci: 'Boloria freija', family: 'Nymfevinger', inatTaxonId: 204862, adbTaxonId: 29831 },
  { id: 'boloria-improba', name_no: 'Dvergperlemorvinge', name_sci: 'Boloria improba', family: 'Nymfevinger', inatTaxonId: 215291, adbTaxonId: 29835 },
  { id: 'euphydryas-iduna', name_no: 'Iduns rutevinge', name_sci: 'Euphydryas iduna', family: 'Nymfevinger', inatTaxonId: 484085, adbTaxonId: 29858 },
  { id: 'melitaea-cinxia', name_no: 'Prikkrutevinge', name_sci: 'Melitaea cinxia', family: 'Nymfevinger', inatTaxonId: 57495, adbTaxonId: 29860 },
  { id: 'melitaea-athalia', name_no: 'Marimjellerutevinge', name_sci: 'Melitaea athalia', family: 'Nymfevinger', inatTaxonId: 132875, adbTaxonId: 29862 },
  { id: 'melitaea-diamina', name_no: 'Mørk rutevinge', name_sci: 'Melitaea diamina', family: 'Nymfevinger', inatTaxonId: 207704, adbTaxonId: 29861 },
  { id: 'limenitis-populi', name_no: 'Ospesommerfugl', name_sci: 'Limenitis populi', family: 'Nymfevinger', inatTaxonId: 52413, adbTaxonId: 29865 },
  { id: 'apatura-iris', name_no: 'Stor purpurkåpe', name_sci: 'Apatura iris', family: 'Nymfevinger', inatTaxonId: 343324, adbTaxonId: 95246 },
  { id: 'lasiommata-megera', name_no: 'Sørringvinge', name_sci: 'Lasiommata megera', family: 'Nymfevinger', inatTaxonId: 147298, adbTaxonId: 29870 },
  { id: 'lasiommata-maera', name_no: 'Klipperingvinge', name_sci: 'Lasiommata maera', family: 'Nymfevinger', inatTaxonId: 123629, adbTaxonId: 29872 },
  { id: 'pararge-aegeria', name_no: 'Skogringvinge', name_sci: 'Pararge aegeria', family: 'Nymfevinger', inatTaxonId: 52592, adbTaxonId: 29868 },
  { id: 'coenonympha-pamphilus', name_no: 'Engringvinge', name_sci: 'Coenonympha pamphilus', family: 'Nymfevinger', inatTaxonId: 52589, adbTaxonId: 29877 },
  { id: 'coenonympha-tullia', name_no: 'Myrringvinge', name_sci: 'Coenonympha tullia', family: 'Nymfevinger', inatTaxonId: 59185, adbTaxonId: 29874 },
  { id: 'aphantopus-hyperantus', name_no: 'Gullringvinge', name_sci: 'Aphantopus hyperantus', family: 'Nymfevinger', inatTaxonId: 62426, adbTaxonId: 29879 },
  { id: 'maniola-jurtina', name_no: 'Rappringvinge', name_sci: 'Maniola jurtina', family: 'Nymfevinger', inatTaxonId: 55653, adbTaxonId: 29881 },
  { id: 'erebia-ligea', name_no: 'Fløyelsringvinge', name_sci: 'Erebia ligea', family: 'Nymfevinger', inatTaxonId: 62381, adbTaxonId: 29883 },
  { id: 'erebia-pandrose', name_no: 'Fjellringvinge', name_sci: 'Erebia pandrose', family: 'Nymfevinger', inatTaxonId: 334019, adbTaxonId: 29887 },
  { id: 'erebia-embla', name_no: 'Emblaringvinge', name_sci: 'Erebia embla', family: 'Nymfevinger', inatTaxonId: 484101, adbTaxonId: 29884 },
  { id: 'erebia-disa', name_no: 'Disaringvinge', name_sci: 'Erebia disa', family: 'Nymfevinger', inatTaxonId: 219415, adbTaxonId: 29885 },
  { id: 'oeneis-jutta', name_no: 'Juttas ringvinge', name_sci: 'Oeneis jutta', family: 'Nymfevinger', inatTaxonId: 198811, adbTaxonId: 29894 },
  { id: 'oeneis-bore', name_no: 'Tundraringvinge', name_sci: 'Oeneis bore', family: 'Nymfevinger', inatTaxonId: 226264, adbTaxonId: 29893 },
  { id: 'oeneis-norna', name_no: 'Nornens ringvinge', name_sci: 'Oeneis norna', family: 'Nymfevinger', inatTaxonId: 358936, adbTaxonId: 29892 },
  { id: 'boloria-eunomia', name_no: 'Ringperlemorvinge', name_sci: 'Boloria eunomia', family: 'Nymfevinger', inatTaxonId: 215289, adbTaxonId: 29827 },
  { id: 'boloria-chariclea', name_no: 'Arktisk perlemorvinge', name_sci: 'Boloria chariclea', family: 'Nymfevinger', inatTaxonId: 194027, adbTaxonId: 29830 },
  { id: 'boloria-polaris', name_no: 'Polarperlemorvinge', name_sci: 'Boloria polaris', family: 'Nymfevinger', inatTaxonId: 215294, adbTaxonId: 29832 },
  { id: 'boloria-thore', name_no: 'Tors perlemorvinge', name_sci: 'Boloria thore', family: 'Nymfevinger', inatTaxonId: 484084, adbTaxonId: 29833 },
  { id: 'boloria-napaea', name_no: 'Fjellperlemorvinge', name_sci: 'Boloria napaea', family: 'Nymfevinger', inatTaxonId: 357188, adbTaxonId: 29836 },
  { id: 'issoria-lathonia', name_no: 'Sølvkåpe', name_sci: 'Issoria lathonia', family: 'Nymfevinger', inatTaxonId: 62766, adbTaxonId: 29839 },
  { id: 'lasiommata-petropolitana', name_no: 'Bergringvinge', name_sci: 'Lasiommata petropolitana', family: 'Nymfevinger', inatTaxonId: 466041, adbTaxonId: 29871 },
  { id: 'coenonympha-arcania', name_no: 'Perleringvinge', name_sci: 'Coenonympha arcania', family: 'Nymfevinger', inatTaxonId: 125815, adbTaxonId: 29875 },
  { id: 'coenonympha-hero', name_no: 'Heroringvinge', name_sci: 'Coenonympha hero', family: 'Nymfevinger', inatTaxonId: 349377, adbTaxonId: 29876 },
  { id: 'erebia-medusa', name_no: 'Polarringvinge', name_sci: 'Erebia medusa', family: 'Nymfevinger', inatTaxonId: 333774, adbTaxonId: 141101 },
  { id: 'hipparchia-semele', name_no: 'Kystringvinge', name_sci: 'Hipparchia semele', family: 'Nymfevinger', inatTaxonId: 102800, adbTaxonId: 29890 },
  { id: 'hipparchia-alcyone', name_no: 'Svabergringvinge', name_sci: 'Hipparchia alcyone', family: 'Nymfevinger', inatTaxonId: 362064, adbTaxonId: 225997 },
  { id: 'lycaena-phlaeas', name_no: 'Ildgullvinge', name_sci: 'Lycaena phlaeas', family: 'Glansvinger', inatTaxonId: 55655, adbTaxonId: 29812 },
  { id: 'lycaena-hippothoe', name_no: 'Purpurgullvinge', name_sci: 'Lycaena hippothoe', family: 'Glansvinger', inatTaxonId: 62380, adbTaxonId: 29815 },
  { id: 'lycaena-virgaureae', name_no: 'Oransjegullvinge', name_sci: 'Lycaena virgaureae', family: 'Glansvinger', inatTaxonId: 147078, adbTaxonId: 29814 },
  { id: 'thecla-betulae', name_no: 'Slåpetornstjertvinge', name_sci: 'Thecla betulae', family: 'Glansvinger', inatTaxonId: 362091, adbTaxonId: 29821 },
  { id: 'callophrys-rubi', name_no: 'Grønnstjertvinge', name_sci: 'Callophrys rubi', family: 'Glansvinger', inatTaxonId: 60896, adbTaxonId: 29817 },
  { id: 'favonius-quercus', name_no: 'Eikestjertvinge', name_sci: 'Favonius quercus', family: 'Glansvinger', inatTaxonId: 480251, adbTaxonId: 29823 },
  { id: 'cupido-minimus', name_no: 'Dvergblåvinge', name_sci: 'Cupido minimus', family: 'Glansvinger', inatTaxonId: 129126, adbTaxonId: 29787 },
  { id: 'everes-argiades', name_no: 'Kortstjertet blåvinge', name_sci: 'Everes argiades', family: 'Glansvinger', inatTaxonId: 963490, adbTaxonId: 29788 },
  { id: 'celastrina-argiolus', name_no: 'Vårblåvinge', name_sci: 'Celastrina argiolus', family: 'Glansvinger', inatTaxonId: 55640, adbTaxonId: 29789 },
  { id: 'plebejus-argus', name_no: 'Argusblåvinge', name_sci: 'Plebejus argus', family: 'Glansvinger', inatTaxonId: 57484, adbTaxonId: 29799 },
  { id: 'plebejus-idas', name_no: 'Idasblåvinge', name_sci: 'Plebejus idas', family: 'Glansvinger', inatTaxonId: 130785, adbTaxonId: 29800 },
  { id: 'aricia-artaxerxes', name_no: 'Sankthansblåvinge', name_sci: 'Aricia artaxerxes', family: 'Glansvinger', inatTaxonId: 363736, adbTaxonId: 29796 },
  { id: 'polyommatus-icarus', name_no: 'Tiriltungeblåvinge', name_sci: 'Polyommatus icarus', family: 'Glansvinger', inatTaxonId: 55641, adbTaxonId: 29810 },
  { id: 'agriades-aquilo', name_no: 'Polarblåvinge', name_sci: 'Agriades aquilo', family: 'Glansvinger', inatTaxonId: 209735, adbTaxonId: 89985 },
  { id: 'agriades-glandon', name_no: 'Alpeblåvinge', name_sci: 'Agriades glandon', family: 'Glansvinger', inatTaxonId: 367948, adbTaxonId: 29811 },
  { id: 'lycaena-helle', name_no: 'Fiolett gullvinge', name_sci: 'Lycaena helle', family: 'Glansvinger', inatTaxonId: 1606825, adbTaxonId: 29813 },
  { id: 'scolitantides-orion', name_no: 'Klippeblåvinge', name_sci: 'Scolitantides orion', family: 'Glansvinger', inatTaxonId: 358780, adbTaxonId: 29791 },
  { id: 'glaucopsyche-alexis', name_no: 'Kløverblåvinge', name_sci: 'Glaucopsyche alexis', family: 'Glansvinger', inatTaxonId: 60834, adbTaxonId: 29793 },
  { id: 'aricia-nicias', name_no: 'Kileblåvinge', name_sci: 'Aricia nicias', family: 'Glansvinger', inatTaxonId: 484074, adbTaxonId: 29797 },
  { id: 'plebejus-argyrognomon', name_no: 'Lakrismjeltblåvinge', name_sci: 'Plebejus argyrognomon', family: 'Glansvinger', inatTaxonId: 346129, adbTaxonId: 29801 },
  { id: 'agriades-optilete', name_no: 'Myrblåvinge', name_sci: 'Agriades optilete', family: 'Glansvinger', inatTaxonId: 483726, adbTaxonId: 29805 },
  { id: 'cyaniris-semiargus', name_no: 'Engblåvinge', name_sci: 'Cyaniris semiargus', family: 'Glansvinger', inatTaxonId: 62439, adbTaxonId: 29808 },
  { id: 'polyommatus-amandus', name_no: 'Sølvblåvinge', name_sci: 'Polyommatus amandus', family: 'Glansvinger', inatTaxonId: 362078, adbTaxonId: 29809 },
  { id: 'eumedonia-eumedon', name_no: 'Brun blåvinge', name_sci: 'Eumedonia eumedon', family: 'Glansvinger', inatTaxonId: 548481, adbTaxonId: 29795 },
  { id: 'agriades-orbitulus', name_no: 'Fjellblåvinge', name_sci: 'Agriades orbitulus', family: 'Glansvinger', inatTaxonId: 780120, adbTaxonId: 84548 },
  { id: 'pieris-brassicae', name_no: 'Stor kålsommerfugl', name_sci: 'Pieris brassicae', family: 'Hvitvinger', inatTaxonId: 55401, adbTaxonId: 29771 },
  { id: 'pieris-rapae', name_no: 'Liten kålsommerfugl', name_sci: 'Pieris rapae', family: 'Hvitvinger', inatTaxonId: 55626, adbTaxonId: 29772 },
  { id: 'pieris-napi', name_no: 'Rapssommerfugl', name_sci: 'Pieris napi', family: 'Hvitvinger', inatTaxonId: 54087, adbTaxonId: 29773 },
  { id: 'pieris-dulcinea', name_no: 'Grønnåre-kålsommerfugl', name_sci: 'Pieris dulcinea', family: 'Hvitvinger', inatTaxonId: 358701, adbTaxonId: 29742 },
  { id: 'pontia-edusa', name_no: 'Vandrehvitvinge', name_sci: 'Pontia edusa', family: 'Hvitvinger', inatTaxonId: 127103, adbTaxonId: 91453 },
  { id: 'anthocharis-cardamines', name_no: 'Aurorasommerfugl', name_sci: 'Anthocharis cardamines', family: 'Hvitvinger', inatTaxonId: 51495, adbTaxonId: 29767 },
  { id: 'colias-palaeno', name_no: 'Myrgulvinge', name_sci: 'Colias palaeno', family: 'Hvitvinger', inatTaxonId: 217396, adbTaxonId: 29780 },
  { id: 'colias-hecla', name_no: 'Mjeltgulvinge', name_sci: 'Colias hecla', family: 'Hvitvinger', inatTaxonId: 217393, adbTaxonId: 29778 },
  { id: 'colias-nastes', name_no: 'Nordlandsgulvinge', name_sci: 'Colias nastes', family: 'Hvitvinger', inatTaxonId: 217395, adbTaxonId: 29758 },
  { id: 'colias-hyale', name_no: 'Blek vandregulvinge', name_sci: 'Colias hyale', family: 'Hvitvinger', inatTaxonId: 124160, adbTaxonId: 95243 },
  { id: 'gonepteryx-rhamni', name_no: 'Sitronsommerfugl', name_sci: 'Gonepteryx rhamni', family: 'Hvitvinger', inatTaxonId: 52771, adbTaxonId: 29783 },
  { id: 'leptidea-sinapis', name_no: 'Skoghvitvinge', name_sci: 'Leptidea sinapis', family: 'Hvitvinger', inatTaxonId: 123816, adbTaxonId: 29763 },
  { id: 'leptidea-juvernica', name_no: 'Enghvitvinge', name_sci: 'Leptidea juvernica', family: 'Hvitvinger', inatTaxonId: 709444, adbTaxonId: 84562 },
  { id: 'aporia-crataegi', name_no: 'Hagtornsommerfugl', name_sci: 'Aporia crataegi', family: 'Hvitvinger', inatTaxonId: 61295, adbTaxonId: 29769 },
  { id: 'colias-tyche', name_no: 'Polargulvinge', name_sci: 'Colias tyche', family: 'Hvitvinger', inatTaxonId: 217399, adbTaxonId: 141099 },
  { id: 'papilio-machaon', name_no: 'Svalestjert', name_sci: 'Papilio machaon', family: 'Svalestjerter', inatTaxonId: 56529, adbTaxonId: 29759 },
  { id: 'iphiclides-podalirius', name_no: 'Seglvinge', name_sci: 'Iphiclides podalirius', family: 'Svalestjerter', inatTaxonId: 62749, adbTaxonId: 29730 },
  { id: 'parnassius-apollo', name_no: 'Apollosommerfugl', name_sci: 'Parnassius apollo', family: 'Svalestjerter', inatTaxonId: 108799, adbTaxonId: 29755 },
  { id: 'parnassius-mnemosyne', name_no: 'Mnemosynesommerfugl', name_sci: 'Parnassius mnemosyne', family: 'Svalestjerter', inatTaxonId: 57485, adbTaxonId: 29756 },
  { id: 'ochlodes-sylvanus', name_no: 'Engsmyger', name_sci: 'Ochlodes sylvanus', family: 'Smygere', inatTaxonId: 61781, adbTaxonId: 29750 },
  { id: 'thymelicus-sylvestris', name_no: 'Brun bredvinge', name_sci: 'Thymelicus sylvestris', family: 'Smygere', inatTaxonId: 128544, adbTaxonId: 29720 },
  { id: 'thymelicus-lineola', name_no: 'Timoteismyger', name_sci: 'Thymelicus lineola', family: 'Smygere', inatTaxonId: 58484, adbTaxonId: 29746 },
  { id: 'hesperia-comma', name_no: 'Kommasmyger', name_sci: 'Hesperia comma', family: 'Smygere', inatTaxonId: 58468, adbTaxonId: 29748 },
  { id: 'carterocephalus-palaemon', name_no: 'Gulflekksmyger', name_sci: 'Carterocephalus palaemon', family: 'Smygere', inatTaxonId: 122375, adbTaxonId: 29742 },
  { id: 'erynnis-tages', name_no: 'Tiriltungesmyger', name_sci: 'Erynnis tages', family: 'Smygere', inatTaxonId: 133434, adbTaxonId: 29734 },
  { id: 'pyrgus-malvae', name_no: 'Bakkesmyger', name_sci: 'Pyrgus malvae', family: 'Smygere', inatTaxonId: 201519, adbTaxonId: 29738 },
  { id: 'pyrgus-centaureae', name_no: 'Moltesmyger', name_sci: 'Pyrgus centaureae', family: 'Smygere', inatTaxonId: 229679, adbTaxonId: 29737 },
  { id: 'pyrgus-andromedae', name_no: 'Polarsmyger', name_sci: 'Pyrgus andromedae', family: 'Smygere', inatTaxonId: 111442, adbTaxonId: 29736 },
  { id: 'pyrgus-alveus', name_no: 'Alvesmyger', name_sci: 'Pyrgus alveus', family: 'Smygere', inatTaxonId: 207678, adbTaxonId: 29739 },
  { id: 'carterocephalus-silvicola', name_no: 'Svartflekksmyger', name_sci: 'Carterocephalus silvicola', family: 'Smygere', inatTaxonId: 358618, adbTaxonId: 29743 },
];

export const SPECIES: Species[] = BASE_SPECIES.map((species) => {
  const redlistCategory = REDLIST_OVERRIDES[species.name_sci.toLowerCase()] ?? 'LC';
  return {
    ...species,
    redlistCategory,
    rarity: toRarity(redlistCategory),
  };
});

export const SPECIES_BY_ID = Object.fromEntries(SPECIES.map((species) => [species.id, species]));
export const SPECIES_BY_INAT_ID = Object.fromEntries(SPECIES.map((species) => [species.inatTaxonId, species]));
