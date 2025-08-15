
const fs = require('fs');
const path = require('path');

const DEBUG = process.env.DEBUG === 'true';

// Create dist directory if it doesn't exist
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist', { recursive: true });
}

// List of files to copy to dist
const filesToCopy = [
  'index.html',
  'styles.css',
  'sheet.css',
  'quest-styles.css',
  'app.js',
  'dice.js',
  'nav.js',
  'quests.js',
  'settings.js',
  'sheet.js',
  'utils.js',
  'wizard.js',
  'capacitor.config.json'
];

// Copy files
filesToCopy.forEach(file => {
  if (fs.existsSync(file)) {
    fs.copyFileSync(file, path.join('dist', file));
    DEBUG && console.log(`Copied ${file} to dist/`);
  } else {
    DEBUG && console.log(`Warning: ${file} not found, skipping...`);
  }
});

// Copy directories
const dirsToCopy = ['images', 'data', 'attached_assets', 'dice-box'];

dirsToCopy.forEach(dir => {
  if (fs.existsSync(dir)) {
    copyDir(dir, path.join('dist', dir));
    DEBUG && console.log(`Copied ${dir}/ to dist/`);
  } else {
    DEBUG && console.log(`Warning: ${dir} directory not found, skipping...`);
  }
});

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

DEBUG && console.log('Build completed! Files copied to dist/');
