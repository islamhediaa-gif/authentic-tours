const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const cleanDir = 'd:/authentic_clean';

// Copy compile.js if missing
if (!fs.existsSync(path.join(cleanDir, 'compile.js'))) {
  console.log('Copying compile.js to clean directory...');
  fs.copyFileSync('d:/authentic/compile.js', path.join(cleanDir, 'compile.js'));
}

function run(cmd) {
  console.log(`Running: ${cmd}`);
  execSync(cmd, { cwd: cleanDir, stdio: 'inherit' });
}

try {
  // console.log('--- Installing Dependencies ---');
  // run('npm install');
  
  console.log('--- Building Web (Portal) ---');
  run('npm run build');
  
  console.log('--- Building Desktop (EXE) ---');
  run('npm run dist');
  
  console.log('--- Build Process Completed Successfully ---');
} catch (error) {
  console.error('--- Build Process Failed ---');
  console.error(error);
  process.exit(1);
}
