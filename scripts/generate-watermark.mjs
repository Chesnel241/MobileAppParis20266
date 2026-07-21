// Génère public/uploads/watermark.png : la pastille blanche avec le logo composite
// (colombe/globe + PARIS 2026), apposée automatiquement sur les photos de la Pellicule.
import sharp from 'sharp';

const dove = await sharp('public/uploads/logo_lwmfd.png').resize(96, 96, { fit: 'inside' }).png().toBuffer();
const doveMeta = await sharp(dove).metadata();
const paris = await sharp('public/uploads/img7-removebg-preview.png').resize(150, 96, { fit: 'inside' }).png().toBuffer();
const parisMeta = await sharp(paris).metadata();

const W = 340, H = 132;
const pill = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <rect width="${W}" height="${H}" rx="${H / 2}" fill="#FFFFFF" fill-opacity="0.92"/>
    <rect x="${doveMeta.width + 40}" y="30" width="2" height="${H - 60}" fill="rgba(18,23,42,0.15)"/>
  </svg>`
);

await sharp(pill)
  .composite([
    { input: dove, left: 26, top: Math.round((H - doveMeta.height) / 2) },
    { input: paris, left: doveMeta.width + 60, top: Math.round((H - parisMeta.height) / 2) },
  ])
  .png()
  .toFile('public/uploads/watermark.png');

console.log('public/uploads/watermark.png généré');
