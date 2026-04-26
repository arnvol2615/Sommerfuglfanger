import fs from 'fs';

// Read butterflies.ts
const butterfliesContent = fs.readFileSync('src/data/butterflies.ts', 'utf-8');
const butterflySpecies = butterfliesContent.match(/name_sci: '([^']+)'/g).map(m => m.split("'")[1]).sort();

// Read ADB JSON
const adbData = JSON.parse(fs.readFileSync('scripts/output/adb-species-status.json', 'utf-8'));
const adbSpecies = adbData.species.map(s => s.name_sci).sort();

console.log('Butterflies.ts species:', butterflySpecies.length);
console.log('ADB species (filtered):', adbSpecies.length);
console.log('\nMissing in butterflies.ts (but in ADB):');
adbSpecies.forEach(name => {
  if (!butterflySpecies.includes(name)) {
    const adbEntry = adbData.species.find(s => s.name_sci === name);
    console.log(`  - ${name} (${adbEntry.category}, adbTaxonId: ${adbEntry.adbTaxonId})`);
  }
});

console.log('\nExtra in butterflies.ts (but not in ADB):');
butterflySpecies.forEach(name => {
  if (!adbSpecies.includes(name)) {
    console.log(`  - ${name}`);
  }
});
