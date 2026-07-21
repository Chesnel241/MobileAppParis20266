// Vérifie que les textes de store/STORE_LISTING.md respectent les limites
// de caractères d'App Store Connect et de Google Play Console.
//   node scripts/check-store-listing.mjs
import { readFileSync } from 'node:fs';

const md = readFileSync('store/STORE_LISTING.md', 'utf8');

// Chaque section "### Titre (N max)" est suivie d'un bloc ``` ... ```
const LIMITS = [];
const re = /^###\s+(.+?)\s*\((\d+)\s*max[^)]*\)\s*$\n+```\n([\s\S]*?)\n```/gm;
let m;
while ((m = re.exec(md)) !== null) {
  LIMITS.push({ label: m[1], limit: Number(m[2]), value: m[3] });
}

if (!LIMITS.length) {
  console.error('Aucune section à vérifier trouvée.');
  process.exit(1);
}

let failed = 0;
for (const { label, limit, value } of LIMITS) {
  const len = [...value].length; // compte les caractères Unicode, pas les octets
  const ok = len <= limit;
  if (!ok) failed++;
  console.log(`${ok ? '✅' : '❌'} ${String(len).padStart(4)} / ${String(limit).padEnd(4)}  ${label}`);
}

console.log(`\n${LIMITS.length} champ(s) vérifié(s), ${failed} dépassement(s).`);
process.exit(failed ? 1 : 0);
