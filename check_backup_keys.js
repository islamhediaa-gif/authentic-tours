const fs = require('fs');
const backup = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_2026-01-29.json', 'utf8'));
console.log('Backup keys:', Object.keys(backup));
if (backup.journal_entries) console.log('Found journal_entries, count:', backup.journal_entries.length);
if (backup.journal_lines) console.log('Found journal_lines, count:', backup.journal_lines.length);
if (backup.journalEntries) console.log('Found journalEntries, count:', backup.journalEntries.length);
if (backup.journalLines) console.log('Found journalLines, count:', backup.journalLines.length);
