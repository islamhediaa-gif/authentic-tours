
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rzjjmacmwocusqeoyyhu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6amptYWNtd29jdXNxZW95eWh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNjY0NzksImV4cCI6MjA4NDc0MjQ3OX0.VqHRuZXbecsSu9Fzo6ilU8NimO_gwTnQDGC_yAklfYg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function searchAuditLogs() {
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

  const logs = data.data.auditLogs || [];
  console.log(`Searching through ${logs.length} audit logs...`);
  
  const targetLogs = logs.filter(l => 
    l.details && (l.details.includes('Updated accommodation') || l.details.includes('تسكين'))
  ).slice(0, 20);

  targetLogs.forEach(l => {
    console.log(`[${l.timestamp}] ${l.action} ${l.entityType}: ${l.details}`);
    if (l.oldValue && typeof l.oldValue === 'object') {
       // Check if oldValue had accommodation with names
    }
  });
}

searchAuditLogs();
