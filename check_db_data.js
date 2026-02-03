const mysql = require('mysql2/promise');
async function run() {
  try {
    const conn = await mysql.createConnection('mysql://root:OHkOpzVMmgrPdqejmRMdyymxjFLvbYoK@interchange.proxy.rlwy.net:36607/railway');
    console.log('Connected to Railway DB');
    
    const [rows] = await conn.execute('SELECT account_type, COUNT(*) as count FROM journal_lines GROUP BY account_type');
    console.log('Account Types in journal_lines:', rows);
    
    const [revRows] = await conn.execute("SELECT SUM(credit - debit) as total FROM journal_lines WHERE account_type = 'REVENUE'");
    console.log('Total Revenue in DB:', revRows[0].total);
    
    const [txCount] = await conn.execute('SELECT COUNT(*) as count FROM transactions');
    console.log('Total Transactions in DB:', txCount[0].count);
    
    const [jeNoLines] = await conn.execute('SELECT COUNT(*) as count FROM journal_entries je LEFT JOIN journal_lines jl ON je.id = jl.journal_entry_id WHERE jl.id IS NULL');
    console.log('Journal Entries with NO lines:', jeNoLines[0].count);

    const [settings] = await conn.execute("SELECT * FROM tenant_settings WHERE tenant_id = 'authentic'");
    console.log('Tenant Settings:', settings);
    const [stCols] = await conn.execute('SHOW COLUMNS FROM tenant_settings');
    console.log('Columns in tenant_settings:', stCols.map(c => c.Field));

    await conn.end();
  } catch (err) {
    console.error('Error:', err);
  }
}
run();
