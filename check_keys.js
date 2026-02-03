const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:\\authentic\\Backup_Nebras_2026-01-29.json', 'utf8'));
console.log('Root keys:', Object.keys(data));
if (data.settings) console.log('Settings keys:', Object.keys(data.settings));
