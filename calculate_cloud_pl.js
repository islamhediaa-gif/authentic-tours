
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const TENANT_ID = 'authentic';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function calculateCloudPL() {
    console.log(`Calculating P&L from Cloud for tenant: ${TENANT_ID}`);
    const startDate = '2025-12-30'; // Go back one day to be safe
    const endDate = '2026-01-29';   // Go forward one day to be safe

    const { data: entries, error } = await supabase
        .from('journal_entries')
        .select(`
            id,
            date,
            journal_lines (
                account_id,
                account_name,
                account_type,
                debit,
                credit
            )
        `)
        .eq('tenant_id', TENANT_ID)
        .gte('date', startDate)
        .lte('date', endDate);

    if (error) {
        console.error("Error fetching journal entries:", error.message);
        return;
    }

    console.log(`Fetched ${entries.length} entries`);
    let totalLinesFetched = 0;
    const balances = {};
    entries.forEach(entry => {
        totalLinesFetched += (entry.journal_lines || []).length;
        (entry.journal_lines || []).forEach(line => {
            const key = line.account_id || line.account_name;
            if (!balances[key]) {
                balances[key] = { 
                    name: line.account_name, 
                    type: line.account_type, 
                    debit: 0, 
                    credit: 0 
                };
            }
            balances[key].debit += (line.debit || 0);
            balances[key].credit += (line.credit || 0);
        });
    });
    console.log(`Total lines processed: ${totalLinesFetched}`);

    let flightRev = 0;
    let hajjUmrahRev = 0;
    let otherRev = 0;
    let directCosts = 0;
    let adminExp = 0;

    Object.entries(balances).forEach(([id, b]) => {
        const netCredit = b.credit - b.debit;
        const netDebit = b.debit - b.credit;

        if (id === 'FLIGHT_REVENUE') {
            flightRev += netCredit;
            console.log(`FLIGHT_REVENUE: credit=${b.credit}, debit=${b.debit}, net=${netCredit}`);
        }
        else if (id === 'HAJJ_UMRAH_REVENUE') {
            hajjUmrahRev += netCredit;
            console.log(`HAJJ_UMRAH_REVENUE: credit=${b.credit}, debit=${b.debit}, net=${netCredit}`);
        }
        else if (b.type === 'REVENUE' || id.includes('REVENUE') || id === 'SALES_REVENUE' || id === 'SERVICE_REVENUE') {
            otherRev += netCredit;
        }
        else if (id === 'FLIGHT_COST' || id === 'HAJJ_UMRAH_COST' || id === 'COGS' || id === 'SERVICE_COST' || id === 'DIRECT_COST') {
            directCosts += netDebit;
            console.log(`DIRECT_COST_ITEM: id=${id}, net=${netDebit}`);
        }
        else if (b.type === 'EXPENSE') {
            adminExp += netDebit;
        }
    });

    console.log("--- Cloud Profit & Loss ---");
    console.log("إيرادات حجز طيران:", flightRev.toFixed(3));
    console.log("إيرادات العمرة والحج:", hajjUmrahRev.toFixed(3));
    console.log("إيرادات خدمات أخرى:", otherRev.toFixed(3));
    console.log("إجمالي الإيرادات:", (flightRev + hajjUmrahRev + otherRev).toFixed(3));
    console.log("---------------------------------------");
    console.log("تكاليف مباشرة:", directCosts.toFixed(3));
    console.log("مصروفات إدارية:", adminExp.toFixed(3));
    console.log("إجمالي التكاليف:", (directCosts + adminExp).toFixed(3));
    console.log("---------------------------------------");
    console.log("صافي الربح / الخسارة:", (flightRev + hajjUmrahRev + otherRev - directCosts - adminExp).toFixed(3));
}

calculateCloudPL();
