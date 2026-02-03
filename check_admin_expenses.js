const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:\\authentic\\Backup_Nebras_2026-01-29.json', 'utf8'));

const transactions = data.transactions || [];
const journalEntries = data.journalEntries || [];

// Simplified Trial Balance logic to find Admin Expenses
const balances = {};

journalEntries.forEach(entry => {
    (entry.lines || []).forEach(line => {
        const key = line.accountId;
        if (!balances[key]) balances[key] = { id: key, name: line.accountName, type: line.accountType, debit: 0, credit: 0 };
        balances[key].debit += (line.debit || 0);
        balances[key].credit += (line.credit || 0);
    });
});

const adminExps = Object.values(balances).filter(b => 
    b.type === 'EXPENSE' && 
    !['FLIGHT_COST', 'HAJJ_UMRAH_COST', 'COGS', 'SERVICE_COST', 'DIRECT_COST'].includes(b.id)
);

console.log('Admin Expenses (Total:', adminExps.reduce((s, b) => s + (b.debit - b.credit), 0), '):');
adminExps.forEach(b => {
    if (b.debit - b.credit !== 0) {
        console.log(`- ${b.name} (${b.id}): ${b.debit - b.credit}`);
    }
});
