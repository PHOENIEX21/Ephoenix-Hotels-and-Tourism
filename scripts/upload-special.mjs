import fs from 'node:fs';
import path from 'node:path';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import sharp from 'sharp';
dotenv.config({ path: path.resolve('.env.local') });
cloudinary.config({ cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });
const maxBytes = 10 * 1024 * 1024;
async function prepare(filePath) {
  if (fs.statSync(filePath).size <= maxBytes) return filePath;
  let width = 2400, quality = 82, buffer;
  do {
    buffer = await sharp(filePath).resize({ width, withoutEnlargement: true }).jpeg({ quality, mozjpeg: true }).toBuffer();
    if (buffer.length <= maxBytes) break;
    if (quality > 52) quality -= 10; else width = Math.round(width * 0.8);
  } while (width >= 1000);
  const tmp = path.join(path.dirname(filePath), `.upload-${path.parse(filePath).name}.jpg`);
  fs.writeFileSync(tmp, buffer);
  return tmp;
}
const dir = 'BRANCH PHOTOS/ANNEX II/special';
const names = fs.readdirSync(path.resolve(dir))
  .filter(name => /\.(jpg|jpeg|png|webp)$/i.test(name))
  .sort((a, b) => {
    const order = (name) => {
      const base = path.parse(name).name;
      if (base === 'use1') return 1;
      if (base === 'use2') return 2;
      if (base === 'use3') return 3;
      const number = base.match(/^z \((\d+)\)$/)?.[1];
      return number ? 10 + Number(number) : 100;
    };
    return order(a) - order(b);
  });
for (const name of names) {
  const src = path.resolve(dir, name);
  const up = await prepare(src);
  const stem = path.parse(name).name;
  const publicName = /^(use\d+)$/i.test(stem) ? stem.toLowerCase() : stem.toLowerCase().replace(/^z \((\d+)\)$/, 'z-$1').replace(/[^a-z0-9-]+/g, '-');
  const publicId = `ephoenix/annex-ii/special/${publicName}`;
  const r = await cloudinary.uploader.upload(up, { public_id: publicId, resource_type: 'image', overwrite: true });
  if (up !== src) fs.rmSync(up, { force: true });
  console.log(`${name} -> ${r.secure_url}`);
}
