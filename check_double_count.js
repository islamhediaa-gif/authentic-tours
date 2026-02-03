const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:\\authentic\\Backup_Nebras_2026-01-29.json', 'utf8'));

const transactions = data.transactions || [];
const journalEntries = data.journalEntries || [];

// Accounts that are considered Direct Costs in useIncomeStatement
const directCostAccountIds = ['FLIGHT_COST', 'HAJJ_UMRAH_COST', 'COGS', 'SERVICE_COST', 'DIRECT_COST'];

let totalLinkedAdminExp = 0;
const linkedExps = [];

transactions.forEach(t => {
    if (t.type === 'EXPENSE' && !t.isVoided) {
        const isLinked = !!(t.masterTripId || t.programId);
        const cat = t.category || '';
        const isDirect = isLinked || cat === 'HAJJ_UMRAH';
        
        // In useIncomeStatement, if isDirect is true, it goes into totalDirectCosts.
        // But if its accountId is NOT in directCostAccountIds, it ALSO goes into adminExpenses via Trial Balance.
        
        // Find the journal entry for this transaction to get the accountId
        const je = journalEntries.find(j => j.id === t.journalEntryId);
        if (je) {
            const expLine = je.lines.find(l => l.debit > 0 && l.accountType === 'EXPENSE');
            if (expLine && !directCostAccountIds.includes(expLine.accountId)) {
                if (isDirect) {
                    totalLinkedAdminExp += (t.amountInBase || 0);
                    linkedExps.push({
                        desc: t.description,
                        amount: t.amountInBase,
                        account: expLine.accountName,
                        id: expLine.accountId
                    });
                }
            }
        }
    }
});

console.log('Total Double-Counted Expenses (Direct and Admin):', totalLinkedAdminExp);
linkedExps.slice(0, 10).forEach(e => console.log(`- ${e.desc}: ${e.amount} (${e.account})`));
