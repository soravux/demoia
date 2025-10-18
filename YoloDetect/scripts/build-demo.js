import { rename, existsSync, copyFileSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';

const distPath = './dist';
const docsPath = '../docs';
const oldFile = join(distPath, 'index.html');
const newFile = join(distPath, 'demo_yolo.html');

// Step 1: Rename index.html to demo_yolo.html
if (existsSync(oldFile)) {
  rename(oldFile, newFile, (err) => {
    if (err) {
      console.error('Error renaming file:', err);
      process.exit(1);
    } else {
      console.log('✅ Successfully renamed index.html to demo_yolo.html');
      
      // Step 2: Copy demo_yolo.html from dist to docs directory
      const demoGptSource = join(distPath, 'demo_yolo.html');
      const demoGptDest = join(docsPath, 'demo_yolo.html');
      
      if (existsSync(demoGptSource)) {
        try {
          copyFileSync(demoGptSource, demoGptDest);
          console.log('✅ Successfully copied demo_yolo.html to docs folder');
        } catch (err) {
          console.error('Error copying demo_yolo.html:', err);
        }
      } else {
        console.warn('⚠️ demo_yolo.html not found in dist folder');
      }
      
      // Step 3: Copy assets directory from dist to docs
      const assetsSource = join(distPath, 'assets');
      const assetsDest = join(docsPath, 'assets');
      
      if (existsSync(assetsSource)) {
        try {
          // Create assets directory in docs if it doesn't exist
          if (!existsSync(assetsDest)) {
            mkdirSync(assetsDest, { recursive: true });
          }
          
          // Copy all files from assets directory
          const files = readdirSync(assetsSource);
          
          files.forEach(file => {
            const sourceFile = join(assetsSource, file);
            const destFile = join(assetsDest, file);
            
            if (statSync(sourceFile).isFile()) {
              copyFileSync(sourceFile, destFile);
            }
          });
          
          console.log('✅ Successfully copied assets to docs folder');
        } catch (err) {
          console.error('Error copying assets:', err);
        }
      } else {
        console.warn('⚠️ assets directory not found in dist folder');
      }
    }
  });
} else {
  console.error('❌ index.html not found in dist folder');
  process.exit(1);
}
