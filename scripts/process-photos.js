import fs from 'fs';
import path from 'path';
import exifr from 'exifr';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const photosDir = path.join(__dirname, '../client/public/photos');
const outputFilePath = path.join(__dirname, '../client/public/photos/metadata.json');

async function processPhotos() {
  const files = fs.readdirSync(photosDir).filter(f => f.endsWith('.jpg') || f.endsWith('.jpeg'));
  const metadataArray = [];

  for (const file of files) {
    const filePath = path.join(photosDir, file);
    try {
      // Extract only the specific EXIF blocks we need
      const exif = await exifr.parse(filePath, ['Make', 'Model', 'LensModel', 'FNumber', 'ExposureTime', 'ISO', 'DateTimeOriginal']);
      
      metadataArray.push({
        img: `/photos/${file}`,
        camera: exif?.Model ? `${exif.Make} ${exif.Model}` : 'Canon EOS 1200D',
        lens: exif?.LensModel || '18-55mm kit lens',
        aperture: exif?.FNumber ? `ƒ/${exif.FNumber}` : 'Unknown',
        shutter: exif?.ExposureTime ? `1/${Math.round(1/exif.ExposureTime)}s` : 'Unknown',
        iso: exif?.ISO ? `ISO ${exif.ISO}` : 'Unknown',
        year: exif?.DateTimeOriginal ? new Date(exif.DateTimeOriginal).getFullYear().toString() : '2025'
      });
      console.log(`Processed: ${file}`);
    } catch (err) {
      console.error(`Error processing ${file}:`, err.message);
    }
  }

  fs.writeFileSync(outputFilePath, JSON.stringify(metadataArray, null, 2));
  console.log(`\nSuccess! Wrote metadata for ${metadataArray.length} photos to metadata.json`);
}

processPhotos();