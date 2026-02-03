const mysql = require('mysql2/promise');
(async () => {
  try {
    const conn = await mysql.createConnection('mysql://root:OHkOpzVMmgrPdqejmRMdyymxjFLvbYoK@interchange.proxy.rlwy.net:36607/railway');
    const [rows] = await conn.execute('SELECT COUNT(*) as count FROM transactions WHERE journal_entry_id IS NOT NULL');
    console.log('Transactions with journal_entry_id:', rows[0].count);
    
    const [sample] = await conn.execute('SELECT * FROM transactions WHERE journal_entry_id IS NOT NULL LIMIT 1');
    console.log('Sample Transaction:', sample[0]);
    
    await conn.end();
  } catch (err) {
    console.error(err);
  }
})();
