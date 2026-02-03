const fs = require('fs');
const backup = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));

const jes = backup.journalEntries || [];
const targetJe = jes.find(je => je.refNo === 'RV-0347' || (je.description && je.description.includes('RV-0347')) || (je.lines && je.lines.some(l => l.description && l.description.includes('RV-0347'))));

if (targetJe) {
    console.log('Found Journal Entry:', JSON.stringify(targetJe, null, 2));
} else {
    // Search by description content
    const similarJes = jes.filter(je => je.description && je.description.includes('امينه احمد محمود'));
    console.log('Similar JEs by description:', JSON.stringify(similarJes, null, 2));
}
