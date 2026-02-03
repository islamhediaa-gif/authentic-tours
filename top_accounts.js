
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
const journalEntries = data.journalEntries || [];
const balances = {};

journalEntries.forEach(entry => {
    (entry.lines || []).forEach(line => {
        const key = line.accountId || line.accountName;
        if (!balances[key]) balances[key] = { name: line.accountName, type: line.accountType, debit: 0, credit: 0, count: 0 };
        balances[key].debit += (line.debit || 0);
        balances[key].credit += (line.credit || 0);
        balances[key].count++;
    });
});

const sorted = Object.entries(balances)
    .map(([id, b]) => ({ id, ...b, netDebit: b.debit - b.credit, netCredit: b.credit - b.debit }))
    .sort((a, b) => Math.abs(b.netDebit) - Math.abs(a.netDebit));

console.log("--- Top 20 Accounts by Balance ---");
sorted.slice(0, 20).forEach(a => {
    console.log(`${a.id.padEnd(30)} | ${a.type.padEnd(10)} | Net=${(a.netDebit).toFixed(2)} | Count=${a.count}`);
});
