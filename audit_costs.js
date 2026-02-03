const fs = require('fs');
const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
const jes = data.journalEntries || [];
const ADMIN_CATEGORIES = [
    'SALARY', 'RENT', 'OFFICE', 'EXPENSE_GEN', 'MARKETING', 
    'COMMISSION_EXP', 'UTILITIES', 'MAINTENANCE', 'INTERNET', 
    'HOSPITALITY', 'STATIONERY', 'FEES', 'TAXES', 'INSURANCE',
    'رواتب', 'أجور', 'إيجار', 'كهرباء', 'مياه', 'غاز',
    'هاتف', 'اتصالات', 'دعاية', 'إعلان', 'مكتبية', 'مطبوعات',
    'بوفيه', 'ضيافة', 'نثريات', 'أخرى', 'صيانة', 'عمولات موظفين',
    'بريد', 'انترنت'
];

let totalCost = 0;
let totalCostWithMirror = 0;
const costEntries = [];

jes.forEach(entry => {
    const lines = entry.lines || [];
    const revLine = lines.find(l => l.accountType === 'REVENUE');
    
    lines.forEach(line => {
        if (line.accountType === 'EXPENSE') {
            const sid = (line.accountId || '').toUpperCase();
            const sname = (line.accountName || '');
            const isAdmin = ADMIN_CATEGORIES.some(cat => sid.includes(cat.toUpperCase()) || sname.includes(cat));
            
            if (!isAdmin) {
                const cost = Number(line.debit || 0) - Number(line.credit || 0);
                if (cost > 0) {
                    totalCostWithMirror += cost;
                    let isMirror = false;
                    if (revLine) {
                        const revAmount = Number(revLine.credit || 0);
                        if (revAmount > 0 && Math.abs(revAmount - cost) < 0.1) {
                            isMirror = true;
                        }
                    }
                    
                    if (!isMirror) {
                        totalCost += cost;
                        costEntries.push({ id: entry.id, amount: cost, name: line.accountName, date: entry.date, desc: entry.description });
                    }
                }
            }
        }
    });
});

const types = new Set();
jes.forEach(j => j.lines.forEach(l => types.add(l.accountType)));
console.log('Account Types:', Array.from(types));
