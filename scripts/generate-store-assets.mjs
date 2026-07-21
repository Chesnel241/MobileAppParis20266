// Génère les visuels requis par l'App Store et le Play Store dans store/.
//   node scripts/generate-store-assets.mjs
//
// Sorties :
//   store/appstore-icon-1024.png   Icône App Store (1024x1024, SANS canal alpha — exigé par Apple)
//   store/play-icon-512.png        Icône Play Store (512x512)
//   store/play-feature-1024x500.png  Bandeau Play Store
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const NAVY = '#0E1B38';
const YELLOW = '#F2E94E';
mkdirSync('store', { recursive: true });

const text = (content, { size, color, width, weight = 800, spacing = 2, anchor = 'middle', x = '50%' }) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${Math.round(size * 1.5)}">
      <text x="${x}" y="50%" dominant-baseline="central" text-anchor="${anchor}"
        font-family="Avenir Next, Helvetica Neue, Helvetica, Arial, sans-serif"
        font-weight="${weight}" font-size="${size}" letter-spacing="${spacing}"
        fill="${color}">${content}</text>
    </svg>`
  );

// ---------- Icônes ----------
// Aplaties sur fond navy : Apple refuse toute transparence sur l'icône du Store.
await sharp('assets/icon.png')
  .flatten({ background: NAVY })
  .resize(1024, 1024)
  .png()
  .toFile('store/appstore-icon-1024.png');

await sharp('assets/icon.png')
  .flatten({ background: NAVY })
  .resize(512, 512)
  .png()
  .toFile('store/play-icon-512.png');

// ---------- Bandeau Play Store (1024x500) ----------
const W = 1024, H = 500;

// Pastille blanche reprenant le verrou de marque (colombe/globe + PARIS 2026)
const dove = await sharp('public/uploads/logo_lwmfd.png').resize(150, 150, { fit: 'inside' }).png().toBuffer();
const doveMeta = await sharp(dove).metadata();
const paris = await sharp('public/uploads/img7-removebg-preview.png').resize(250, 150, { fit: 'inside' }).png().toBuffer();
const parisMeta = await sharp(paris).metadata();

const pillW = 60 + doveMeta.width + 40 + parisMeta.width;
const pillH = 210;
const pill = await sharp(
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${pillW}" height="${pillH}">
      <rect width="${pillW}" height="${pillH}" rx="${pillH / 2}" fill="#FFFFFF"/>
      <rect x="${doveMeta.width + 48}" y="55" width="2" height="${pillH - 110}" fill="rgba(18,23,42,0.15)"/>
    </svg>`
  )
)
  .composite([
    { input: dove, left: 30, top: Math.round((pillH - doveMeta.height) / 2) },
    { input: paris, left: doveMeta.width + 70, top: Math.round((pillH - parisMeta.height) / 2) },
  ])
  .png()
  .toBuffer();

// Fond dégradé cohérent avec l'en-tête de l'app
const background = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0E1B38"/>
        <stop offset="55%" stop-color="#16305A"/>
        <stop offset="140%" stop-color="#2FBF8F"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
    <circle cx="${W - 60}" cy="-30" r="150" fill="rgba(255,255,255,0.05)"/>
    <circle cx="60" cy="${H + 40}" r="120" fill="rgba(255,255,255,0.04)"/>
  </svg>`
);

await sharp(background)
  .composite([
    { input: pill, left: Math.round((W - pillW) / 2), top: 70 },
    { input: await sharp(text('LIFE WORD MISSION FRANCE &amp; DIASPORA', { size: 27, color: YELLOW, width: W, weight: 700, spacing: 5 })).png().toBuffer(), left: 0, top: 312 },
    { input: await sharp(text('24 – 31 juillet 2026 · Paris', { size: 34, color: '#FFFFFF', width: W, weight: 600, spacing: 1 })).png().toBuffer(), left: 0, top: 375 },
  ])
  .flatten({ background: NAVY }) // bandeau opaque : pas de transparence côté Play
  .removeAlpha()
  .png()
  .toFile('store/play-feature-1024x500.png');

console.log('Visuels générés dans store/ :');
console.log('  appstore-icon-1024.png    (App Store, sans alpha)');
console.log('  play-icon-512.png         (Play Store)');
console.log('  play-feature-1024x500.png (bandeau Play Store)');
