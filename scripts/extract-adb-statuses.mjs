import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const DEFAULT_URL = 'https://artsdatabanken.no/tree-of-life/subspecies/872980';
const DEFAULT_OUTPUT = 'scripts/output/adb-species-status.json';
const DEFAULT_ALLOWED = ['LC', 'VU', 'EN', 'CR'];
const DEFAULT_IDENTIFY_FILE = 'supabase-functions-updated/identify.ts';

const REDLIST_VALUES = new Set(['LC', 'VU', 'EN', 'CR', 'NT', 'RE', 'DD', 'NA', 'NE', 'NK', 'NR']);

function parseArgs(argv) {
  const options = {
    url: DEFAULT_URL,
    output: DEFAULT_OUTPUT,
    allowed: DEFAULT_ALLOWED,
    identifyFile: DEFAULT_IDENTIFY_FILE,
  };

  for (const arg of argv) {
    if (arg.startsWith('--url=')) {
      options.url = arg.slice('--url='.length);
      continue;
    }
    if (arg.startsWith('--output=')) {
      options.output = arg.slice('--output='.length);
      continue;
    }
    if (arg.startsWith('--allowed=')) {
      options.allowed = arg
        .slice('--allowed='.length)
        .split(',')
        .map((v) => v.trim().toUpperCase())
        .filter(Boolean);
      continue;
    }
    if (arg.startsWith('--identify-file=')) {
      options.identifyFile = arg.slice('--identify-file='.length);
      continue;
    }
  }

  return options;
}

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function extractAdbTaxonId(link) {
  if (!link) return null;
  const match = link.match(/\/arter\/takson\/(\d+)/);
  return match ? Number(match[1]) : null;
}

function extractCategory(card, row) {
  const raw = `${card ?? ''} ${row ?? ''}`;

  const classMatch = raw.match(/class=["']circle\s+([a-z]{2})["']/i);
  if (classMatch) {
    const value = classMatch[1].toUpperCase();
    return REDLIST_VALUES.has(value) ? value : null;
  }

  const textMatch = raw.match(/>\s*(LC|VU|EN|CR|NT|RE|DD|NA|NE|NK|NR)\s*</i);
  if (textMatch) {
    const value = textMatch[1].toUpperCase();
    return REDLIST_VALUES.has(value) ? value : null;
  }

  return null;
}

function toRarity(category) {
  if (category === 'CR' || category === 'EN' || category === 'VU') return 'Svaert sjelden';
  if (category === 'NT') return 'Sjelden';
  if (category === 'LC') return 'Vanlig';
  return 'Uvanlig';
}

function slugifyScientificName(nameSci) {
  return nameSci
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function extractIdentifySpecies(tsSource) {
  const arrayStart = tsSource.indexOf('const SPECIES: Species[] = [');
  if (arrayStart < 0) return [];

  const afterStart = tsSource.slice(arrayStart);
  const arrayEnd = afterStart.indexOf('];');
  if (arrayEnd < 0) return [];

  const block = afterStart.slice(0, arrayEnd);
  const objectRegex = /\{\s*id:\s*'([^']+)'[^}]*name_no:\s*'([^']*)'[^}]*name_sci:\s*'([^']+)'[^}]*family:\s*'([^']+)'[^}]*inatTaxonId:\s*(\d+)[^}]*adbTaxonId:\s*(\d+)[^}]*redlistCategory:\s*'([^']+)'[^}]*rarity:\s*'([^']+)'\s*\}/g;

  const rows = [];
  let match = objectRegex.exec(block);
  while (match) {
    rows.push({
      id: match[1],
      name_no: match[2],
      name_sci: match[3],
      family: match[4],
      inatTaxonId: Number(match[5]),
      adbTaxonId: Number(match[6]),
      redlistCategory: match[7],
      rarity: match[8],
    });
    match = objectRegex.exec(block);
  }

  return rows;
}

async function buildIdentifyCoverage(identifyFilePath, adbRowsBySciName) {
  try {
    const source = await readFile(identifyFilePath, 'utf8');
    const identifyRows = extractIdentifySpecies(source);

    if (identifyRows.length === 0) {
      return {
        identifyFile: identifyFilePath,
        parsedIdentifyRows: 0,
        error: 'Fant ingen species-rader i identify.ts med parseren.',
      };
    }

    const missingInAdb = [];
    const categoryMismatches = [];
    const adbTaxonMismatches = [];

    for (const row of identifyRows) {
      const key = row.name_sci.toLowerCase();
      const adb = adbRowsBySciName.get(key);
      if (!adb) {
        missingInAdb.push(row.name_sci);
        continue;
      }

      if (adb.adbTaxonId !== row.adbTaxonId) {
        adbTaxonMismatches.push({
          name_sci: row.name_sci,
          identifyAdbTaxonId: row.adbTaxonId,
          sourceAdbTaxonId: adb.adbTaxonId,
        });
      }

      if (adb.category && adb.category !== row.redlistCategory) {
        categoryMismatches.push({
          name_sci: row.name_sci,
          identifyCategory: row.redlistCategory,
          sourceCategory: adb.category,
        });
      }
    }

    return {
      identifyFile: identifyFilePath,
      parsedIdentifyRows: identifyRows.length,
      requiredFieldsForIdentify: ['id', 'name_no', 'name_sci', 'family', 'inatTaxonId', 'adbTaxonId', 'redlistCategory', 'rarity'],
      availableFromAdbSource: ['name_no', 'name_sci', 'adbTaxonId', 'redlistCategory'],
      derivableFromAdbSource: ['id (from name_sci slug)', 'rarity (from redlistCategory)'],
      notAvailableFromAdbSource: ['family', 'inatTaxonId'],
      missingInAdbCount: missingInAdb.length,
      missingInAdb,
      adbTaxonMismatchesCount: adbTaxonMismatches.length,
      adbTaxonMismatches,
      categoryMismatchesCount: categoryMismatches.length,
      categoryMismatches,
    };
  } catch (error) {
    return {
      identifyFile: identifyFilePath,
      parsedIdentifyRows: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  const { url, output, allowed, identifyFile } = parseArgs(process.argv.slice(2));
  const allowedSet = new Set(allowed);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Klarte ikke hente data: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const species = data?.children?.species;
  if (!Array.isArray(species)) {
    throw new Error('Forventet data.children.species som liste.');
  }

  const allRows = species.map((item) => {
    const category = extractCategory(item.card, item.row);
    const name_sci = stripHtml(item.scientificName ?? '');
    return {
      id: item.id,
      adbTaxonId: extractAdbTaxonId(item.link),
      name_no: item.popularName ?? '',
      name_sci,
      category,
      rarity: category ? toRarity(category) : null,
      derivedSlugId: slugifyScientificName(name_sci),
    };
  });

  const categoryDistribution = {};
  for (const row of allRows) {
    const key = row.category ?? 'MISSING';
    categoryDistribution[key] = (categoryDistribution[key] ?? 0) + 1;
  }

  const rows = allRows.filter((item) => item.category && allowedSet.has(item.category));
  const rowsBySciName = new Map(allRows.map((row) => [row.name_sci.toLowerCase(), row]));
  const identifyCoverage = await buildIdentifyCoverage(resolve(identifyFile), rowsBySciName);

  const outputPath = resolve(output);
  const outputDir = dirname(outputPath);
  await mkdir(outputDir, { recursive: true });

  const payload = {
    source: url,
    createdAt: new Date().toISOString(),
    totalSpeciesInSource: allRows.length,
    categoryDistribution,
    missingCategoryCount: categoryDistribution.MISSING ?? 0,
    allowed: [...allowedSet],
    filteredCount: rows.length,
    count: rows.length,
    identifyCoverage,
    species: rows,
  };

  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  console.log(`Skrev ${rows.length} filtrerte arter til ${outputPath}`);
  console.log(`Kilde inneholder totalt ${allRows.length} arter.`);
  console.log(`Arter uten gjenkjent kategori: ${categoryDistribution.MISSING ?? 0}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
