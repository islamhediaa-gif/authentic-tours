const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
const search = 'بدر الماسه';
console.log(JSON.stringify(data.journalEntries.filter(je => 
    (je.description || '').includes(search) || 
    je.lines.some(l => (l.accountName || '').includes(search))
).map(je => ({
    ref: je.refNo, 
    desc: je.description, 
    lines: je.lines.filter(l => l.accountType === 'EXPENSE' || l.accountType === 'REVENUE').map(l => ({
        name: l.accountName, 
        debit: l.debit, 
        credit: l.credit, 
        cc: l.costCenterId, 
        prog: l.programId,
        type: l.accountType
    }))
})), null, 2));
