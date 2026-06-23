import * as fs from 'fs';
import * as path from 'path';

const rootPath = process.cwd();
const resDir = path.join(rootPath, 'android', 'app', 'src', 'main', 'res');
const srcImage = path.join(rootPath, 'Logo', 'ChatGPT Image Jun 23, 2026, 12_38_43 PM.png');

function configureAppIcons() {
  console.log(`[Icon Setup] Checking source image: ${srcImage}`);
  if (!fs.existsSync(srcImage)) {
    console.error(`[Error] Source image not found at ${srcImage}`);
    return;
  }

  // Define densities/folders
  const targetDirs = [
    'mipmap-hdpi',
    'mipmap-mdpi',
    'mipmap-xhdpi',
    'mipmap-xxhdpi',
    'mipmap-xxxhdpi',
  ];

  // Remove adaptive anydpi-v26 xml icons so Android defaults to using our PNG cleanly
  const anyDpiDir = path.join(resDir, 'mipmap-anydpi-v26');
  const filesToDelete = ['ic_launcher.xml', 'ic_launcher_round.xml'];
  filesToDelete.forEach(file => {
    const filePath = path.join(anyDpiDir, file);
    if (fs.existsSync(filePath)) {
      console.log(`[Icon Setup] Deleting style-override launcher XML: ${filePath}`);
      fs.unlinkSync(filePath);
    }
  });

  // Loop through target resource folders
  targetDirs.forEach(dirName => {
    const dirPath = path.join(resDir, dirName);
    if (!fs.existsSync(dirPath)) {
      console.warn(`[Icon Setup] Directory not found, skipping: ${dirPath}`);
      return;
    }

    // Clean existing versions
    const oldIcons = ['ic_launcher.webp', 'ic_launcher_round.webp', 'ic_launcher_foreground.webp'];
    oldIcons.forEach(icon => {
      const iconPath = path.join(dirPath, icon);
      if (fs.existsSync(iconPath)) {
        console.log(`[Icon Setup] Deleting old webp icon: ${iconPath}`);
        fs.unlinkSync(iconPath);
      }
    });

    // Copy new png files
    const newIcons = ['ic_launcher.png', 'ic_launcher_round.png', 'ic_launcher_foreground.png'];
    newIcons.forEach(icon => {
      const destPath = path.join(dirPath, icon);
      fs.copyFileSync(srcImage, destPath);
      console.log(`[Icon Setup] Successfully copied new icon: ${destPath}`);
    });
  });

  console.log('[Icon Setup] Finished updating local Android source icons.');
}

configureAppIcons();
