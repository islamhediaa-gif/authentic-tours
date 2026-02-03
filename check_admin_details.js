const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:\\authentic\\Backup_Nebras_2026-01-29.json', 'utf8'));

const transactions = data.transactions || [];
const journalEntries = data.journalEntries || [];
const accounts = data.accounts || [];

// Calculate Trial Balance like the hook does
const balanceMap = {};
journalEntries.forEach(je => {
    if (je.isVoided) return;
    (je.lines || []).forEach(l => {
        const key = l.accountId;
        if (!balanceMap[key]) balanceMap[key] = { debit: 0, credit: 0 };
        balanceMap[key].debit += (l.debit || 0);
        balanceMap[key].credit += (l.credit || 0);
    });
});

const trialBalance = accounts.map(a => {
    const b = balanceMap[a.id] || { debit: 0, credit: 0 };
    return {
        ...a,
        periodDebit: b.debit,
        periodCredit: b.credit
    };
});

const adminExpenses = trialBalance.filter(b => 
    b.type === 'EXPENSE' && 
    !['FLIGHT_COST', 'HAJJ_UMRAH_COST', 'COGS', 'SERVICE_COST', 'DIRECT_COST'].includes(b.id)
);

console.log('--- Admin Expenses in Trial Balance ---');
adminExpenses.forEach(e => {
    const net = e.periodDebit - e.periodCredit;
    if (net !== 0) {
        console.log(`${e.id.padEnd(25)} | ${e.name.padEnd(30)} | ${net.toFixed(2)}`);
    }
});

const totalAdmin = adminExpenses.reduce((s, e) => s + (e.periodDebit - e.periodCredit), 0);
console.log(`\nTotal Admin Expenses: ${totalAdmin.toFixed(2)}`);
