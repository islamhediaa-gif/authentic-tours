const fs = require('fs');
const backup = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
const programs = (backup.programs || []).filter(p => p.masterTripId === '1768576135774');

programs.forEach(p => {
  console.log(`Program: ${p.name}`);
  (p.components || []).forEach(c => {
    console.log(`  Component: ${c.name}, Type: ${c.type}, Cost: ${c.costPrice}, Sale: ${c.salePrice}`);
  });
});
