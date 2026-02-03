
const fs = require('fs');

const API_URL = 'https://authentic-tours-production.up.railway.app';
const tenantId = 'authentic';

const camelToSnake = (str) => str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

const mapKeysToSnake = (obj) => {
  if (Array.isArray(obj)) return obj.map((v) => mapKeysToSnake(v));
  if (obj && typeof obj === 'object' && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => ({
      ...result,
      [camelToSnake(key)]: mapKeysToSnake(obj[key]),
    }), {});
  }
  return obj;
};

async function upsertTable(tableName, records) {
  if (!records || records.length === 0) return;
  console.log(`Upserting ${records.length} records to ${tableName}...`);
  
  const CHUNK_SIZE = 100;
  for (let i = 0; i < records.length; i += CHUNK_SIZE) {
    const chunk = records.slice(i, i + CHUNK_SIZE);
    try {
      const response = await fetch(`${API_URL}/api/upsert/${tableName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: chunk, tenant_id: tenantId })
      });
      const res = await response.json();
      if (!res.success) {
        console.error(`Error in chunk ${i/CHUNK_SIZE} of ${tableName}:`, res.error);
      }
    } catch (e) {
      console.error(`Failed to push chunk ${i/CHUNK_SIZE} of ${tableName}:`, e.message);
    }
  }
}

async function restore() {
  const data = JSON.parse(fs.readFileSync('Backup_Nebras_2026-01-29.json', 'utf8'));
  console.log('Backup loaded successfully.');

  // 1. Settings
  if (data.settings) {
    const s = mapKeysToSnake(data.settings);
    delete s.name; 
    delete s.logo;
    await upsertTable('tenant_settings', [s]);
  }

  // 2. Simple tables
  const simpleTables = [
    { key: 'customers', table: 'customers' },
    { key: 'suppliers', table: 'suppliers' },
    { key: 'treasuries', table: 'treasuries' },
    { key: 'programs', table: 'programs' },
    { key: 'partners', table: 'partners' },
    { key: 'employees', table: 'employees' },
    { key: 'costCenters', table: 'cost_centers' },
    { key: 'masterTrips', table: 'master_trips' },
    { key: 'currencies', table: 'currencies' },
    { key: 'transactions', table: 'transactions' },
    { key: 'users', table: 'users' }
  ];

  for (const item of simpleTables) {
    if (data[item.key] && Array.isArray(data[item.key])) {
      await upsertTable(item.table, mapKeysToSnake(data[item.key]));
    }
  }

  // 3. Journal Entries and Lines
  if (data.journalEntries && Array.isArray(data.journalEntries)) {
    const entries = [];
    const lines = [];

    data.journalEntries.forEach(je => {
      const { lines: jeLines, ...jeData } = je;
      entries.push(mapKeysToSnake(jeData));
      if (Array.isArray(jeLines)) {
        jeLines.forEach((line, index) => {
          lines.push(mapKeysToSnake({
            ...line,
            journal_entry_id: je.id,
            id: `${je.id}_${index}`
          }));
        });
      }
    });

    await upsertTable('journal_entries', entries);
    await upsertTable('journal_lines', lines);
  }

  // 4. Save Full Backup
  console.log('Saving full backup to cloud...');
  try {
    const backupResponse = await fetch(`${API_URL}/api/backup/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: tenantId, data: data })
    });
    const backupRes = await backupResponse.json();
    console.log('Full backup save result:', backupRes);
  } catch (e) {
    console.error('Failed to save full backup:', e.message);
  }

  console.log('Restoration completed!');
}

restore();
