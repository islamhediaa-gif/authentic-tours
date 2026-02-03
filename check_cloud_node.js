
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkCloud() {
  const { data, error } = await supabase
    .from('user_backups')
    .select('data')
    .eq('user_id', 'authentic')
    .order('updated_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (data && data.length > 0) {
    const fullData = data[0].data;
    const masterTrips = fullData.masterTrips || [];
    console.log(`Total Master Trips: ${masterTrips.length}`);
    masterTrips.forEach(mt => {
      console.log(`Trip: ${mt.name} (${mt.id})`);
      if (mt.accommodation) {
        const mecca = mt.accommodation.mecca?.rooms?.length || 0;
        const medina = mt.accommodation.medina?.rooms?.length || 0;
        console.log(`  - Accommodation: FOUND (Mecca: ${mecca}, Medina: ${medina})`);
      } else {
        console.log(`  - Accommodation: MISSING`);
      }
    });
  } else {
    console.log('No backup found');
  }
}

checkCloud();
