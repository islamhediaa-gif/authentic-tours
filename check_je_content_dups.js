const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_Deduplicated.json', 'utf8'));

const jes = data.journalEntries || [];
const seen = new Map();
const dups = [];

jes.forEach(je => {
    // Create a fingerprint of the JE
    const lines = (je.lines || []).map(l => `${l.accountId}-${l.debit}-${l.credit}`).sort().join('|');
    const fingerprint = `${je.date}-${je.totalAmount}-${lines}`;
    
    if (seen.has(fingerprint)) {
        dups.push({ original: seen.get(fingerprint), duplicate: je.id, desc: je.description });
    } else {
        seen.set(fingerprint, je.id);
    }
});

console.log('--- Identical Journal Entries (Content-wise) ---');
console.log('Found:', dups.length);
dups.forEach(d => {
    console.log(`Original: ${d.original}, Duplicate: ${d.duplicate}, Desc: ${d.desc}`);
});
