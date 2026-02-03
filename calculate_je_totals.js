const fs = require('fs');
const backup = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_2026-01-29.json', 'utf8'));

const analysis = {};
backup.journalEntries.forEach(entry => {
    (entry.lines || []).forEach(line => {
        if (line.accountType === 'REVENUE' || line.accountType === 'EXPENSE') {
            const key = line.accountId || line.accountName;
            if (!analysis[key]) analysis[key] = { type: line.accountType, debit: 0, credit: 0, net: 0 };
            analysis[key].debit += Number(line.debit || 0);
            analysis[key].credit += Number(line.credit || 0);
        }
    });
});

for (let k in analysis) {
    if (analysis[k].type === 'REVENUE') analysis[k].net = analysis[k].credit - analysis[k].debit;
    else analysis[k].net = analysis[k].debit - analysis[k].credit;
}

console.log('--- REVENUE ACCOUNTS ---');
let totalSales = 0;
for (let k in analysis) {
    if (analysis[k].type === 'REVENUE') {
        console.log(`${k}: ${analysis[k].net}`);
        totalSales += analysis[k].net;
    }
}
console.log('Total Sales (from JEs):', totalSales);

console.log('\n--- EXPENSE ACCOUNTS ---');
for (let k in analysis) {
    if (analysis[k].type === 'EXPENSE') {
        console.log(`${k}: ${analysis[k].net}`);
    }
}
