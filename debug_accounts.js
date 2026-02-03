const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:\\authentic\\Backup_Nebras_2026-01-29.json', 'utf8'));

const accounts = data.accounts || [];
const journalEntries = data.journalEntries || [];

// Let's see all account types and some examples
const types = {};
accounts.forEach(a => {
    types[a.type] = (types[a.type] || 0) + 1;
});
console.log('Account Types:', types);

const expenseAccounts = accounts.filter(a => a.type === 'EXPENSE' || a.id.toLowerCase().includes('expense') || a.name.includes('مصروف'));
console.log(`Found ${expenseAccounts.length} potential expense accounts`);

const balanceMap = {};
journalEntries.forEach(je => {
    if (je.isVoided) return;
    (je.lines || []).forEach(l => {
        if (!balanceMap[l.accountId]) balanceMap[l.accountId] = 0;
        balanceMap[l.accountId] += (l.debit || 0) - (l.credit || 0);
    });
});

console.log('--- Accounts with balances that might be expenses ---');
expenseAccounts.forEach(a => {
    const bal = balanceMap[a.id] || 0;
    if (bal !== 0) {
        console.log(`ID: ${a.id} | Type: ${a.type} | Name: ${a.name} | Balance: ${bal}`);
    }
});
