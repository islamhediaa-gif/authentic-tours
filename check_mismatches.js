
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_2026-01-29.json', 'utf8'));

const transactions = data.transactions || [];
const journalEntries = data.journalEntries || data.journal || [];
const costAccounts = ['HAJJ_UMRAH_COST', 'FLIGHT_COST', 'SERVICE_COST'];

transactions.forEach(t => {
    if (t.journalEntryId) {
        const entry = journalEntries.find(e => e.id === t.journalEntryId);
        if (entry) {
            let jeCost = 0;
            (entry.lines || []).forEach(l => {
                if (costAccounts.includes(l.accountId)) {
                    jeCost += (Number(l.debit || 0) - Number(l.credit || 0));
                }
            });
            
            const txCost = Number(t.purchasePriceInBase || 0);
            if (Math.abs(jeCost - txCost) > 1) {
                console.log(`Mismatch in TX ${t.id}: TX Cost ${txCost} vs JE Cost ${jeCost}`);
                console.log(`Description: ${t.description}`);
            }
        }
    }
});
