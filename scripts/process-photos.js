import fs from 'fs';
import path from 'path';
import exifr from 'exifr';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// We now read from your new raw folder, and output to the public folder
const rawDir = path.join(__dirname, '../raw-photos');
const publicPhotosDir = path.join(__dirname, '../client/public/photos');
const outputFilePath = path.join(publicPhotosDir, 'metadata.json');

async function processPhotos() {
  // Failsafe checks
  if (!fs.existsSync(rawDir)) {
    console.error(`❌ Please create a 'raw-photos' folder at the root and put your original images there.`);
    return;
  }
  if (!fs.existsSync(publicPhotosDir)) {
    fs.mkdirSync(publicPhotosDir, { recursive: true });
  }

  const files = fs.readdirSync(rawDir).filter(f => f.toLowerCase().match(/\.(jpg|jpeg|png)$/));
  const metadataArray = [];
  let counter = 1;

  for (const file of files) {
    const rawFilePath = path.join(rawDir, file);
    const newFileName = `frame-${String(counter).padStart(2, '0')}.jpg`;
    const publicFilePath = path.join(publicPhotosDir, newFileName);

    try {
      // 1. Read EXIF from the ORIGINAL file before we touch it
      const exif = await exifr.parse(rawFilePath, ['Make', 'Model', 'LensModel', 'FNumber', 'ExposureTime', 'ISO', 'DateTimeOriginal']);
      
      // 2. Compress & Auto-Orient using Sharp
      // The .rotate() command here is the magic fix! It reads the original EXIF orientation
      // and physically bakes that rotation into the pixels so it can never be lost.
      await sharp(rawFilePath)
        .rotate() 
        .resize({ width: 1600, withoutEnlargement: true }) // Resizes to max 1600px wide, keeps aspect ratio
        .jpeg({ quality: 80, mozjpeg: true }) // Great compression
        .toFile(publicFilePath);

      // 3. Store the metadata for the frontend
      metadataArray.push({
        id: counter,
        img: `/photos/${newFileName}`,
        title: `Untitled — Frame ${String(counter).padStart(2, '0')}`,
        camera: exif?.Model ? `${exif.Make} ${exif.Model}` : 'Canon EOS 1200D',
        lens: exif?.LensModel || '18-55mm kit lens',
        aperture: exif?.FNumber ? `ƒ/${exif.FNumber}` : 'Unknown',
        shutter: exif?.ExposureTime ? `1/${Math.round(1/exif.ExposureTime)}s` : 'Unknown',
        iso: exif?.ISO ? `ISO ${exif.ISO}` : 'Unknown',
        year: exif?.DateTimeOriginal ? new Date(exif.DateTimeOriginal).getFullYear().toString() : '2025'
      });

      console.log(`✅ Processed: ${file} -> ${newFileName}`);
      counter++;
    } catch (err) {
      console.error(`❌ Error processing ${file}:`, err.message);
    }
  }

  // 4. Save the JSON for the frontend to read
  fs.writeFileSync(outputFilePath, JSON.stringify(metadataArray, null, 2));
  console.log(`\n🎉 Success! Processed ${metadataArray.length} photos and generated metadata.json`);
}

processPhotos();