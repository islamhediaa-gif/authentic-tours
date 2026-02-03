
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
const journalEntries = data.journalEntries || [];

const balances = {};
journalEntries.forEach(entry => {
    (entry.lines || []).forEach(line => {
        const key = line.accountId || line.accountName;
        if (!balances[key]) balances[key] = { id: line.accountId, type: line.accountType, debit: 0, credit: 0 };
        balances[key].debit += (line.debit || 0);
        balances[key].credit += (line.credit || 0);
    });
});

const trialBalance = Object.values(balances);

// Dashboard logic for total revenues
const flightRev = trialBalance.find(b => b.id === 'FLIGHT_REVENUE')?.credit - (trialBalance.find(b => b.id === 'FLIGHT_REVENUE')?.debit || 0) || 0;
const hajjUmrahRev = trialBalance.find(b => b.id === 'HAJJ_UMRAH_REVENUE')?.credit - (trialBalance.find(b => b.id === 'HAJJ_UMRAH_REVENUE')?.debit || 0) || 0;

const otherServiceRev = trialBalance.filter(b => 
    (b.type === 'REVENUE' || b.id === 'SALES_REVENUE' || b.id === 'SERVICE_REVENUE') && 
    !['FLIGHT_REVENUE', 'HAJJ_UMRAH_REVENUE'].includes(b.id)
).reduce((s, b) => s + (b.credit - b.debit), 0);

const totalRevenues = flightRev + hajjUmrahRev + otherServiceRev;

console.log(`Flight Revenue: ${flightRev}`);
console.log(`Hajj/Umrah Revenue: ${hajjUmrahRev}`);
console.log(`Other Service Revenue: ${otherServiceRev}`);
console.log(`Total Sales (Dashboard Logic): ${totalRevenues}`);
