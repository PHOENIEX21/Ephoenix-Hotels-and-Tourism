import fs from 'node:fs';
import path from 'node:path';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import sharp from 'sharp';

dotenv.config({ path: path.resolve('.env.local') });

const root = path.resolve('public/media/branches');
const maxBytes = 10 * 1024 * 1024;

async function prepareUpload(filePath) {
  if (fs.statSync(filePath).size <= maxBytes) return { source: filePath, temporary: false };

  let width = 2400;
  let quality = 82;
  let buffer;
  do {
    buffer = await sharp(filePath).resize({ width, withoutEnlargement: true }).jpeg({ quality, mozjpeg: true }).toBuffer();
    if (buffer.length <= maxBytes) break;
    if (quality > 52) quality -= 10;
    else width = Math.round(width * 0.8);
  } while (width >= 1000);

  if (buffer.length > maxBytes) throw new Error(`compressed output is still ${Math.ceil(buffer.length / 1024 / 1024)} MB`);
  const temporaryPath = path.join(path.dirname(filePath), `.upload-${path.parse(filePath).name}.jpg`);
  fs.writeFileSync(temporaryPath, buffer);
  return { source: temporaryPath, temporary: true };
}

cloudinary.config({ cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });
if (!process.env.CLOUDINARY_API_SECRET) throw new Error('Set Cloudinary variables from .env.local before uploading.');
const files = [];
function collectFiles(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) collectFiles(entryPath);
    else if (/\.(jpe?g|png|webp)$/i.test(entry.name)) files.push(entryPath);
  }
}
collectFiles(root);
const failures = [];
for (const filePath of files) {
  const relativePath = path.relative(root, filePath).replaceAll(path.sep, '/');
  const publicId = `ephoenix/${relativePath.replace(/\.[^.]+$/, '')}`;
  let upload;
  try {
    upload = await prepareUpload(filePath);
    const result = await cloudinary.uploader.upload(upload.source, { public_id: publicId, resource_type: 'image', overwrite: true });
    console.log(`${relativePath}${upload.temporary ? ' (compressed)' : ''} -> ${result.secure_url}`);
  } catch (error) {
    failures.push(`${relativePath}: ${error instanceof Error ? error.message : String(error)}`);
    console.error(`FAILED ${filePath}: ${failures[failures.length - 1].split(': ').slice(1).join(': ')}`);
  } finally {
    if (upload?.temporary) fs.rmSync(upload.source, { force: true });
  }
}
if (failures.length) {
  console.error(`\n${failures.length} file(s) failed:`);
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exitCode = 1;
} else console.log('\nAll uploads completed successfully.');
