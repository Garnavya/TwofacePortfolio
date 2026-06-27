import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rawDir = path.resolve(__dirname, '../raw-photos');
const outDir = path.resolve(__dirname, '../client/public/photos');

async function processPhotos() {
  try {
    // Ensure the output directory exists
    await fs.mkdir(outDir, { recursive: true });

    // Read all files from the raw folder
    const files = await fs.readdir(rawDir);
    
    // Filter for common image formats (ignores hidden files like .DS_Store)
    const imageFiles = files.filter(f => /\.(jpe?g|png|webp|heic)$/i.test(f));

    if (imageFiles.length === 0) {
      console.log('No images found in raw-photos/');
      return;
    }

    // Sort files alphabetically so the numbering is predictable
    imageFiles.sort();

    console.log(`Found ${imageFiles.length} photos. Processing...`);

    // Loop through and process each file
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const inputPath = path.join(rawDir, file);
      
      // Generate the "frame-XX" name (e.g., 1 -> 01, 15 -> 15)
      const id = String(i + 1).padStart(2, '0');
      const outputName = `frame-${id}.jpg`;
      const outputPath = path.join(outDir, outputName);

      // Resize, convert to JPEG, and save
      await sharp(inputPath)
        .resize({ width: 1600, withoutEnlargement: true }) // Shrinks large photos, leaves small ones alone
        .jpeg({ quality: 80 })
        .toFile(outputPath);

      console.log(`✅ ${file}  -->  ${outputName}`);
    }

    console.log('\n🎉 All photos optimized and renamed successfully!');
  } catch (error) {
    console.error('❌ Error processing photos:', error);
  }
}

processPhotos();