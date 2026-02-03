
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function findUsers() {
    console.log("Searching for users 'nada' and 'samar' in cloud...");
    const { data, error } = await supabase
        .from('users')
        .select('username, name, role, tenant_id')
        .or('username.ilike.nada,username.ilike.samar');

    if (error) {
        console.error("Error searching users:", error.message);
    } else {
        if (data.length > 0) {
            console.log("Users found in cloud:");
            console.table(data);
        } else {
            console.log("Users not found in 'users' table. Checking original JSON backup...");
            // If not in relational table yet, they might still be in the blob
            const { data: backupData, error: backupError } = await supabase
                .from('user_backups')
                .select('data')
                .eq('user_id', 'authentic')
                .single();
            
            if (!backupError && backupData.data.users) {
                const found = backupData.data.users.filter(u => 
                    u.username.toLowerCase().includes('nada') || 
                    u.username.toLowerCase().includes('samar')
                );
                if (found.length > 0) {
                    console.log("Users found in JSON Blob (Pending final relational sync):");
                    console.table(found.map(u => ({ username: u.username, name: u.name, role: u.role })));
                } else {
                    console.log("Users not found in JSON Blob either.");
                }
            }
        }
    }
}

findUsers();
