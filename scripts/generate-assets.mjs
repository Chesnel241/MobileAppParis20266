// Génère assets/icon.png (1024) et assets/splash.png (2732) depuis le logo ALWM HD.
// Source : colombe sur globe, recadrée depuis le logo 8000x4500.
// Usage : node scripts/generate-assets.mjs <chemin-logo-source>
import sharp from 'sharp';
import { mkdirSync } from 'fs';

const SRC = process.argv[2];
if (!SRC) {
  console.error('Usage: node scripts/generate-assets.mjs <logo-source.png>');
  process.exit(1);
}

const NAVY = '#0E1B38';
const YELLOW = '#F2E94E';

mkdirSync('assets', { recursive: true });

// Recadrage de la colombe/globe (partie gauche du logo ALWM TV 8000x4500)
const doveCrop = await sharp(SRC)
  .extract({ left: 500, top: 1150, width: 2450, height: 2700 })
  .png()
  .toBuffer();
const dove = await sharp(doveCrop).trim().png().toBuffer();

const textSvg = (text, size, color, width, weight = 800, spacing = 6) => Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${Math.round(size * 1.4)}">
    <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle"
      font-family="Avenir Next, Helvetica, Arial, sans-serif" font-weight="${weight}"
      font-size="${size}" letter-spacing="${spacing}" fill="${color}">${text}</text>
  </svg>`
);

const roundedCard = (size, radius) => Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" rx="${radius}" fill="#FFFFFF"/>
  </svg>`
);

// Carte blanche arrondie contenant la colombe/globe
const makeCard = async (cardSize, radius, doveSize) => {
  const doveResized = await sharp(dove)
    .resize(doveSize, doveSize, { fit: 'inside' })
    .png()
    .toBuffer();
  const m = await sharp(doveResized).metadata();
  return sharp(await sharp(roundedCard(cardSize, radius)).png().toBuffer())
    .composite([{
      input: doveResized,
      left: Math.round((cardSize - m.width) / 2),
      top: Math.round((cardSize - m.height) / 2)
    }])
    .png()
    .toBuffer();
};

// Icône 1024x1024
const iconCard = await makeCard(600, 110, 500);
await sharp({ create: { width: 1024, height: 1024, channels: 4, background: NAVY } })
  .composite([
    { input: iconCard, left: 212, top: 118 },
    { input: await sharp(textSvg('PARIS 2026', 108, YELLOW, 1024)).png().toBuffer(), left: 0, top: 812 }
  ])
  .png()
  .toFile('assets/icon.png');

// Splash 2732x2732
const splashCard = await makeCard(860, 150, 720);
await sharp({ create: { width: 2732, height: 2732, channels: 4, background: NAVY } })
  .composite([
    { input: splashCard, left: 936, top: 936 },
    { input: await sharp(textSvg('CONVENTION', 110, '#FFFFFF', 2732, 700, 16)).png().toBuffer(), left: 0, top: 1930 },
    { input: await sharp(textSvg('PARIS 2026', 150, YELLOW, 2732)).png().toBuffer(), left: 0, top: 2080 }
  ])
  .png()
  .toFile('assets/splash.png');

await sharp('assets/splash.png').toFile('assets/splash-dark.png');
console.log('assets/icon.png, assets/splash.png, assets/splash-dark.png générés');
