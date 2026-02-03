const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:/authentic/Backup_Nebras_2026-01-29.json', 'utf8'));
const je = data.journalEntries || data.journal || [];

const ADMIN_CATEGORIES = [
  'SALARY', 'RENT', 'OFFICE', 'EXPENSE_GEN', 'MARKETING', 
  'COMMISSION_EXP', 'UTILITIES', 'MAINTENANCE', 'INTERNET', 
  'HOSPITALITY', 'STATIONERY', 'FEES', 'TAXES', 'INSURANCE',
  'رواتب وأجور الموظفين', 'إيجار مقر الشركة', 'كهرباء ومياه وغاز',
  'إنترنت وهاتف واتصالات', 'دعاية وتسويق وإعلانات', 'أدوات مكتبية ومطبوعات',
  'بوفيه وضيافة', 'مصاريف عمومية', 'نثريات', 'أخرى'
];

const expensesBreakdown = [];
const jeLines = [];
je.forEach(e => {
  (e.lines || []).forEach(l => {
    if (l.accountType === 'EXPENSE') {
      const cost = Number(l.debit || 0) - Number(l.credit || 0);
      const sid = (l.accountId || '').toUpperCase();
      const sname = (l.accountName || '');
      
      const isExcluded = sid.includes('CUSTOMER') || sid.includes('SUPPLIER') || sid.includes('TREASURY') || 
                         sid.includes('CASH') || sid.includes('SETTLEMENT') || sname.includes('تسوية') || 
                         sname.includes('نقدية') || sname.includes('تحصيل');

      const isAdmin = ADMIN_CATEGORIES.some(cat => sid.includes(cat.toUpperCase()) || sname.includes(cat));
      
      if (!isExcluded) {
        expensesBreakdown.push({ id: l.accountId, name: l.accountName, amount: cost, isAdmin });
      }
    }
  });
});

const summary = expensesBreakdown.reduce((acc, curr) => {
  const key = `${curr.id} (${curr.name})`;
  if (!acc[key]) acc[key] = { amount: 0, isAdmin: curr.isAdmin };
  acc[key].amount += curr.amount;
  return acc;
}, {});

console.log(JSON.stringify(summary, null, 2));
