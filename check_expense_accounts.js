const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));

const accounts = data.accounts || [];

// In this system, account types might be in line with journalEntry.line.accountType
// Let's check all accounts and their types
const typeCounts = {};
accounts.forEach(acc => {
    typeCounts[acc.type] = (typeCounts[acc.type] || 0) + 1;
});
console.log('Account Types:', typeCounts);

const expenseAccounts = accounts.filter(acc => 
    acc.type === 'EXPENSE' || 
    acc.type === 'COST' ||
    acc.id?.includes('COST') ||
    acc.id?.includes('EXPENSE')
);

console.log('\n--- Potential Expense/Cost Accounts ---');
expenseAccounts.forEach(acc => {
    // Note: Trial Balance calculates periodDebit - periodCredit
    // Accounts might not have a 'balance' field but they have IDs
    console.log(`ID: ${acc.id.padEnd(20)} Name: ${acc.name.padEnd(30)} Type: ${acc.type}`);
});
