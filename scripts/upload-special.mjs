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
const dir = 'public/media/branches/annex-ii/special';
for (const name of ['use1.jpg','use2.png','use3.jpg']) {
  const src = path.resolve(dir, name);
  const up = await prepare(src);
  const publicId = `ephoenix/annex-ii/special/${path.parse(name).name}`;
  const r = await cloudinary.uploader.upload(up, { public_id: publicId, resource_type: 'image', overwrite: true });
  if (up !== src) fs.rmSync(up, { force: true });
  console.log(`${name} -> ${r.secure_url}`);
}
