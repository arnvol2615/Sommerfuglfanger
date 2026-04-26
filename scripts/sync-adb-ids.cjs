const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const URL = 'https://artsdatabanken.no/tree-of-life/subspecies/872980';

async function fetchJson(url) {
  const res = await fetch(url, { headers: { accept: 'application/json,text/plain,*/*' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(text.slice(start, end + 1));
    }
    throw new Error('Could not parse JSON response');
  }
}

function buildSciToAdbMap(payload) {
  const out = new Map();
  const species = payload?.children?.species ?? [];
  for (const s of species) {
    const sciRaw = String(s.scientificName || '').replace(/<[^>]+>/g, '').trim();
    const link = String(s.link || '');
    const m = link.match(/\/arter\/takson\/(\d+)/);
    if (!sciRaw || !m) continue;
    const key = sciRaw.toLowerCase();
    out.set(key, Number(m[1]));
  }
  return out;
}

function updateFile(filePath, sciToAdb) {
  const abs = path.join(ROOT, filePath);
  const original = fs.readFileSync(abs, 'utf8');
  let content = original;
  const changes = [];

  const regex = /(name_sci:\s*'([^']+)'[\s\S]*?adbTaxonId:\s*)(\d+)/g;
  content = content.replace(regex, (full, pre, sciName, adbId) => {
    const key = String(sciName).toLowerCase();
    const mapped = sciToAdb.get(key);
    if (!mapped) return full;
    if (Number(adbId) === mapped) return full;
    changes.push({ sciName, from: Number(adbId), to: mapped });
    return `${pre}${mapped}`;
  });

  if (content !== original) {
    fs.writeFileSync(abs, content, 'utf8');
  }
  return changes;
}

(async () => {
  const payload = await fetchJson(URL);
  const sciToAdb = buildSciToAdbMap(payload);

  const files = [
    'src/data/butterflies.ts',
    'supabase-functions-updated/identify.ts',
  ];

  const summary = {};
  for (const f of files) {
    summary[f] = updateFile(f, sciToAdb);
  }

  for (const [file, changes] of Object.entries(summary)) {
    console.log(`\\n${file}: ${changes.length} changes`);
    for (const c of changes) {
      console.log(`- ${c.sciName}: ${c.from} -> ${c.to}`);
    }
  }

  const allNames = new Set();
  const srcText = fs.readFileSync(path.join(ROOT, 'src/data/butterflies.ts'), 'utf8');
  const nameRe = /name_sci:\s*'([^']+)'/g;
  let m;
  while ((m = nameRe.exec(srcText))) {
    allNames.add(m[1].toLowerCase());
  }

  const missing = [...allNames].filter(n => !sciToAdb.has(n));
  console.log(`\\nNames in project: ${allNames.size}`);
  console.log(`Names found in ADB payload: ${allNames.size - missing.length}`);
  console.log(`Names missing from ADB payload: ${missing.length}`);
  if (missing.length) {
    for (const n of missing) console.log(`! missing: ${n}`);
  }
})();
