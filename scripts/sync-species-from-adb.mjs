import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const SOURCE_FILE = resolve('scripts/output/adb-species-status-all.json');
const BUTTERFLIES_FILE = resolve('src/data/butterflies.ts');
const IDENTIFY_FILE = resolve('supabase-functions-updated/identify.ts');

const RISK_CATEGORIES = new Set(['CR', 'EN', 'VU', 'NT', 'LC']);

function normalizeCategory(category) {
  const upper = String(category || '').toUpperCase();
  return RISK_CATEGORIES.has(upper) ? upper : 'LC';
}

function toRarity(category) {
  if (category === 'CR' || category === 'EN' || category === 'VU') return 'Svaert sjelden';
  if (category === 'NT') return 'Sjelden';
  return 'Vanlig';
}

function updateButterflies(content, statusBySciName) {
  const updatedMapEntries = content.replace(
    /^(\s*)'([^']+)'\s*:\s*'([A-Z]{2})',\s*$/gm,
    (line, indent, sciName, currentCategory) => {
      const status = statusBySciName.get(sciName.toLowerCase());
      if (!status) return line;
      const nextCategory = normalizeCategory(status.category);
      if (nextCategory === currentCategory) return line;
      return `${indent}'${sciName}': '${nextCategory}',`;
    }
  );

  return updatedMapEntries.replace(
    /const redlistCategory = REDLIST_CATEGORY_BY_SCI_NAME\[species\.name_sci\.toLowerCase\(\)\] \?\? '[A-Z]{2}';/,
    "const redlistCategory = REDLIST_CATEGORY_BY_SCI_NAME[species.name_sci.toLowerCase()] ?? 'LC';"
  );
}

function updateIdentify(content, statusBySciName) {
  const rowRegex = /\{ id: '([^']+)', name_no: '([^']*)', name_sci: '([^']+)', family: '([^']+)', inatTaxonId: (\d+), adbTaxonId: (\d+), redlistCategory: '([A-Z]{2})', rarity: '([^']+)' \}/g;

  return content.replace(
    rowRegex,
    (row, id, nameNo, nameSci, family, inatTaxonId, adbTaxonId, redlistCategory) => {
      const status = statusBySciName.get(nameSci.toLowerCase());
      if (!status) return row;

      const nextCategory = normalizeCategory(status.category);
      const nextRarity = toRarity(nextCategory);
      const nextAdbTaxonId = Number.isFinite(status.adbTaxonId) ? String(status.adbTaxonId) : adbTaxonId;

      return `{ id: '${id}', name_no: '${nameNo}', name_sci: '${nameSci}', family: '${family}', inatTaxonId: ${inatTaxonId}, adbTaxonId: ${nextAdbTaxonId}, redlistCategory: '${nextCategory}', rarity: '${nextRarity}' }`;
    }
  );
}

async function main() {
  const rawStatus = await readFile(SOURCE_FILE, 'utf8');
  const statusPayload = JSON.parse(rawStatus);
  const statusBySciName = new Map(
    (statusPayload.species || []).map((row) => [String(row.name_sci || '').toLowerCase(), row])
  );

  const butterfliesSource = await readFile(BUTTERFLIES_FILE, 'utf8');
  const identifySource = await readFile(IDENTIFY_FILE, 'utf8');

  const nextButterflies = updateButterflies(butterfliesSource, statusBySciName);
  const nextIdentify = updateIdentify(identifySource, statusBySciName);

  await writeFile(BUTTERFLIES_FILE, nextButterflies, 'utf8');
  await writeFile(IDENTIFY_FILE, nextIdentify, 'utf8');

  console.log('Synced categories/adbTaxonId from ADB output into butterflies.ts and identify.ts');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
