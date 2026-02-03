const fs = require('fs');
const path = 'd:/authentic/Backup_Nebras_2026-01-29.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

function deduplicate(arr, prefix = '') {
    const seen = new Set();
    const result = [];
    arr.forEach(item => {
        let originalId = item.id;
        let newId = originalId;
        let counter = 1;
        while (seen.has(newId)) {
            newId = `${originalId}_dup${counter}`;
            counter++;
        }
        if (newId !== originalId) {
            console.log(`Renaming duplicate ${prefix} ID ${originalId} to ${newId}`);
            item.id = newId;
            // Also update journalEntryId in transactions if it matches
            if (prefix === 'TX' && item.journalEntryId === `JE-${originalId}`) {
                item.journalEntryId = `JE-${newId}`;
            }
        }
        seen.add(newId);
        result.push(item);
    });
    return result;
}

// We need to be careful with JE IDs because transactions refer to them
const originalTransactions = [...data.transactions];
const originalJEs = [...data.journalEntries];

// First, find all TX duplicates and rename them
const txs = deduplicate(data.transactions, 'TX');

// Then, find all JE duplicates and rename them
// Note: If a JE was duplicated because its TX was duplicated, we might have already updated the reference in TX above.
// However, the JEs themselves still have duplicate IDs in the list.
const jes = deduplicate(data.journalEntries, 'JE');

data.transactions = txs;
data.journalEntries = jes;

fs.writeFileSync('d:/authentic/Backup_Nebras_Deduplicated.json', JSON.stringify(data, null, 2));
console.log('Deduplication complete. Saved to Backup_Nebras_Deduplicated.json');
console.log('Final counts - TX:', data.transactions.length, 'JE:', data.journalEntries.length);
