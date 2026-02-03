
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rzjjmacmwocusqeoyyhu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6amptYWNtd29jdXNxZW95eWh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNjY0NzksImV4cCI6MjA4NDc0MjQ3OX0.VqHRuZXbecsSu9Fzo6ilU8NimO_gwTnQDGC_yAklfYg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectRooms() {
  const { data, error } = await supabase
    .from('user_backups')
    .select('data')
    .eq('user_id', 'authentic')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  const trip = data.data.masterTrips.find(t => t.name.includes('22 يناير'));
  if (!trip) {
    console.log('Trip not found');
    return;
  }

  console.log('--- Mecca Accommodation ---');
  if (trip.accommodation?.mecca?.rooms) {
    trip.accommodation.mecca.rooms.forEach((r, i) => {
      console.log(`Room ${i+1} (${r.roomNumber || 'No No.'}): ${r.guests?.length || 0} guests - [${(r.guests || []).map(g => g.name).join(', ')}]`);
    });
  }

  console.log('--- Medina Accommodation ---');
  if (trip.accommodation?.medina?.rooms) {
    trip.accommodation.medina.rooms.forEach((r, i) => {
      console.log(`Room ${i+1} (${r.roomNumber || 'No No.'}): ${r.guests?.length || 0} guests - [${(r.guests || []).map(g => g.name).join(', ')}]`);
    });
  }
}

inspectRooms();
