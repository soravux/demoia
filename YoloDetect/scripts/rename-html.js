import { rename, existsSync } from 'fs';
import { join } from 'path';

const distPath = './dist';
const oldFile = join(distPath, 'index.html');
const newFile = join(distPath, 'demo_yolo.html');

if (existsSync(oldFile)) {
  rename(oldFile, newFile, (err) => {
    if (err) {
      console.error('Error renaming file:', err);
      process.exit(1);
    } else {
      console.log('✅ Successfully renamed index.html to demo_yolo.html');
    }
  });
} else {
  console.error('❌ index.html not found in dist folder');
  process.exit(1);
}
