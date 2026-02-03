const mysql = require('mysql2/promise');

async function run() {
  const dbUrl = 'mysql://root:OHkOpzVMmgrPdqejmRMdyymxjFLvbYoK@interchange.proxy.rlwy.net:36607/railway';
  const conn = await mysql.createConnection(dbUrl);
  console.log('Connected to Railway DB');

  try {
    // Get all transactions for 'authentic'
    const [transactions] = await conn.execute("SELECT * FROM transactions WHERE tenant_id = 'authentic'");
    console.log(`Found ${transactions.length} transactions`);

    // Get all journal lines to avoid duplicates
    const [existingLines] = await conn.execute("SELECT journal_entry_id FROM journal_lines WHERE tenant_id = 'authentic'");
    const entriesWithLines = new Set(existingLines.map(l => l.journal_entry_id));
    console.log(`${entriesWithLines.size} journal entries already have lines`);

    let repairedCount = 0;
    const allRepairedLines = [];

    for (const tx of transactions) {
      const jeId = tx.journal_entry_id || `JE-${tx.id}`;
      if (entriesWithLines.has(jeId)) continue;

      const lines = [];
      const rate = Number(tx.exchange_rate || 1);
      const amountInBase = Number(tx.amount || 0) * rate;
      const sellBase = (Number(tx.selling_price || 0) - Number(tx.discount || 0)) * rate;
      const buyBase = Number(tx.purchase_price || 0) * rate;

      if (tx.category === 'CASH') {
        const mappedType = tx.related_entity_type === 'EMPLOYEE' ? 'LIABILITY' : tx.related_entity_type;
        if (tx.type === 'INCOME') {
          // Debit Treasury, Credit Entity
          lines.push({ account_id: tx.treasury_id, account_type: 'TREASURY', debit: amountInBase, credit: 0 });
          if (tx.related_entity_id) lines.push({ account_id: tx.related_entity_id, account_type: mappedType, debit: 0, credit: amountInBase });
        } else {
          // Debit Entity, Credit Treasury
          lines.push({ account_id: tx.treasury_id, account_type: 'TREASURY', debit: 0, credit: amountInBase });
          if (tx.related_entity_id) lines.push({ account_id: tx.related_entity_id, account_type: mappedType, debit: amountInBase, credit: 0 });
        }
      } else if (['FLIGHT', 'HAJJ_UMRAH', 'GENERAL_SERVICE'].includes(tx.category) || tx.description.includes('عمرة') || tx.description.includes('طيران')) {
        let revId = 'SERVICE_REVENUE';
        let costId = 'SERVICE_COST';
        if (tx.category.startsWith('FLIGHT') || tx.description.includes('طيران')) {
          revId = 'FLIGHT_REVENUE'; costId = 'FLIGHT_COST';
        } else if (tx.category === 'HAJJ_UMRAH' || tx.description.includes('عمرة')) {
          revId = 'HAJJ_UMRAH_REVENUE'; costId = 'HAJJ_UMRAH_COST';
        }

        if (tx.type === 'PURCHASE_ONLY' || tx.is_purchase_only) {
          if (buyBase > 0) {
            lines.push({ account_id: costId, account_type: 'EXPENSE', debit: buyBase, credit: 0 });
            lines.push({ account_id: tx.supplier_id || tx.related_entity_id, account_type: tx.supplier_type || 'SUPPLIER', debit: 0, credit: buyBase });
          }
        } else if (tx.type === 'REVENUE_ONLY' || tx.is_sale_only) {
          if (sellBase > 0) {
            lines.push({ account_id: tx.related_entity_id, account_type: tx.related_entity_type || 'CUSTOMER', debit: sellBase, credit: 0 });
            lines.push({ account_id: revId, account_type: 'REVENUE', debit: 0, credit: sellBase });
          }
        } else {
          if (sellBase > 0) {
            lines.push({ account_id: tx.related_entity_id, account_type: tx.related_entity_type || 'CUSTOMER', debit: sellBase, credit: 0 });
            lines.push({ account_id: revId, account_type: 'REVENUE', debit: 0, credit: sellBase });
          }
          if (buyBase > 0) {
            lines.push({ account_id: costId, account_type: 'EXPENSE', debit: buyBase, credit: 0 });
            lines.push({ account_id: tx.supplier_id || tx.related_entity_id, account_type: tx.supplier_type || 'SUPPLIER', debit: 0, credit: buyBase });
          }
        }
      }

      if (lines.length > 0) {
        lines.forEach((l, idx) => {
          allRepairedLines.push({
            id: `RL_${tx.id}_${idx}`,
            journal_entry_id: jeId,
            tenant_id: 'authentic',
            account_id: l.account_id,
            account_type: l.account_type,
            debit: l.debit,
            credit: l.credit,
            currency_code: tx.currency_code || 'EGP',
            exchange_rate: rate,
            original_amount: l.debit > 0 ? l.debit / rate : l.credit / rate,
            updated_at: new Date()
          });
        });
        repairedCount++;
      }
    }

    console.log(`Prepared ${allRepairedLines.length} journal lines for ${repairedCount} entries`);

    if (allRepairedLines.length > 0) {
      // Insert in batches
      const batchSize = 100;
      for (let i = 0; i < allRepairedLines.length; i += batchSize) {
        const batch = allRepairedLines.slice(i, i + batchSize);
        const keys = Object.keys(batch[0]);
        const placeholders = batch.map(() => `(${keys.map(() => '?').join(',')})`).join(',');
        const values = batch.flatMap(r => keys.map(k => r[k]));
        
        const sql = `INSERT IGNORE INTO journal_lines (${keys.join(',')}) VALUES ${placeholders}`;
        await conn.execute(sql, values);
        console.log(`Synced batch ${i / batchSize + 1}`);
      }
    }

    console.log('Repair completed successfully');

  } catch (err) {
    console.error('Repair failed:', err);
  } finally {
    await conn.end();
  }
}

run();
