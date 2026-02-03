const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_Deduplicated.json', 'utf8'));

const jes = data.journalEntries || [];
const flightCosts = [];

jes.forEach(je => {
    const costLine = (je.lines || []).find(l => l.accountId === 'FLIGHT_COST');
    if (costLine) {
        flightCosts.push({
            jeId: je.id,
            desc: je.description,
            amount: costLine.debit - costLine.credit,
            programId: costLine.programId || 'MISSING'
        });
    }
});

console.log('--- FLIGHT_COST entries ---');
flightCosts.sort((a, b) => b.amount - a.amount);
flightCosts.slice(0, 20).forEach(c => {
    console.log(`JE: ${c.jeId}, Amount: ${c.amount}, Prog: ${c.programId}, Desc: ${c.desc}`);
});
