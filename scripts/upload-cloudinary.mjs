import fs from 'node:fs';
import path from 'node:path';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import sharp from 'sharp';

dotenv.config({ path: process.env.UPLOAD_ENV_FILE || path.resolve('.env.local') });

const root = process.env.UPLOAD_SOURCE_ROOT
  ? path.resolve(process.env.UPLOAD_SOURCE_ROOT)
  : fs.existsSync(path.resolve('BRANCH PHOTOS'))
    ? path.resolve('BRANCH PHOTOS')
    : path.resolve('public/media/branches');
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
const branchNames = { ADEREMI: 'main', 'ANNEX I': 'annex-i', 'ANNEX II': 'annex-ii' };
const slugify = value => value.toLowerCase().trim().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
function collectFiles(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) collectFiles(entryPath);
    else if (/\.(jpe?g|png|webp)$/i.test(entry.name) && (!process.env.UPLOAD_CURATED_ONLY || /^use\d+/i.test(path.parse(entry.name).name)) && (!process.env.UPLOAD_PATH_FILTER || entryPath.toLowerCase().includes(process.env.UPLOAD_PATH_FILTER.toLowerCase()))) files.push(entryPath);
  }
}
collectFiles(root);
const failures = [];
let nextFile = 0;
async function uploadFile(filePath) {
  const parts = path.relative(root, filePath).split(path.sep);
  const branchFolder = parts.shift();
  const branch = branchNames[branchFolder] || slugify(branchFolder);
  const folder = parts.slice(0, -1).map(slugify).join('/');
  const stem = path.parse(parts[parts.length - 1]).name;
  const curated = stem.match(/^use(\d+)/i);
  const name = curated ? `use${curated[1]}` : slugify(stem);
  const publicId = `ephoenix/${branch}/${folder}/${name}`;
  let upload;
  try {
    upload = await prepareUpload(filePath);
    const result = await cloudinary.uploader.upload(upload.source, { public_id: publicId, resource_type: 'image', overwrite: true });
    console.log(`${path.relative(root, filePath)}${upload.temporary ? ' (compressed)' : ''} -> ${result.secure_url}`);
  } catch (error) {
    failures.push(`${relativePath}: ${error instanceof Error ? error.message : String(error)}`);
    console.error(`FAILED ${filePath}: ${failures[failures.length - 1].split(': ').slice(1).join(': ')}`);
  } finally {
    if (upload?.temporary) fs.rmSync(upload.source, { force: true });
  }
}
async function worker() {
  while (nextFile < files.length) {
    const filePath = files[nextFile++];
    await uploadFile(filePath);
  }
}
await Promise.all(Array.from({ length: 4 }, () => worker()));
if (failures.length) {
  console.error(`\n${failures.length} file(s) failed:`);
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exitCode = 1;
} else console.log('\nAll uploads completed successfully.');
