// SupabaseService.ts - خدمة الربط السحابي
// يمكنك الحصول على هذه البيانات عند إنشاء مشروع على supabase.com
import { createClient } from '@supabase/supabase-js';
import { mapKeysToSnake, mapKeysToCamel } from './utils/caseConversion';
import { CompanyData, CompanySettings } from './types';

// استبدل هذه القيم ببيانات مشروعك الحقيقية
const CORRECT_URL = 'https://qxgfkumvrbdmozhvizoz.supabase.co';
const SUPABASE_URL = CORRECT_URL;
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4Z2ZrdW12cmJkbW96aHZpem96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMjcwNTUsImV4cCI6MjA4NTkwMzA1NX0.WLqR6mLQAe8YjwdMAgME3f4Vf3orJD4Gk4XYLvaoafo';

console.log("[SupabaseService] Initializing with URL:", SUPABASE_URL);

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  },
  global: {
    headers: { 'x-application-name': 'nebras-erp' }
  }
});

let activeChannels: Record<string, any> = {};

export const SupabaseService = {
  // دالة لجلب البيانات من جدول معين
  fetchData: async (tableName: string) => {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    const { data, error } = await supabase.from(tableName).select('*');
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  },

  // دالة لحفظ أو تحديث البيانات
  upsertData: async (tableName: string, payload: any) => {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    const { data, error } = await supabase.from(tableName).upsert(payload);
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  },

  // دالة لحفظ قاعدة البيانات بالكامل (كـ JSON) في جدول الإعدادات
  saveFullBackup: async (userId: string, fullData: Partial<CompanyData>, sessionId?: string) => {
    if (!supabase) {
      console.error("Supabase client not initialized. Check your environment variables.");
      return { success: false, error: 'Supabase not configured' };
    }
    console.log(`Attempting to save backup for user: ${userId}`);
    
    const payload: any = { 
      user_id: userId, 
      data: fullData, 
      updated_at: new Date()
    };
    
    if (sessionId) payload.session_id = sessionId;

    let { error } = await supabase
      .from('user_backups')
      .upsert(payload, { onConflict: 'user_id' });
    
    if (error && (error.message.includes('session_id') || error.code === '42703')) {
      console.warn("Retrying save without session_id column...");
      delete payload.session_id;
      const retry = await supabase
        .from('user_backups')
        .upsert(payload, { onConflict: 'user_id' });
      error = retry.error;
    }
    
    if (error) {
      console.error("Supabase Save Error:", error.message, error.details, error.hint);
      return { success: false, error: `${error.message} (${error.details || 'لا توجد تفاصيل إضافية'})` };
    }
    
    console.log("Supabase Save Success!");
    return { success: true };
  },

  loadFullBackup: async (userId: string) => {
    console.log(`[SupabaseService] Starting loadFullBackup for userId: ${userId}`);
    if (!supabase) {
      console.error("[SupabaseService] Supabase client is null!");
      return { success: false, error: 'Supabase not configured' };
    }
    
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Cloud request timed out after 15 seconds')), 15000);
      });

      const requestPromise = supabase
        .from('user_backups')
        .select('data')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1);

      const result: any = await Promise.race([requestPromise, timeoutPromise]);
      const { data, error: sbError } = result;
        
      if (sbError) {
        console.error("[SupabaseService] Cloud load error:", sbError.message);
        return { success: false, error: sbError.message };
      }
      
      if (!data || data.length === 0) {
        console.warn(`[SupabaseService] No backup found in cloud for user: ${userId}`);
        return { success: false, error: 'No backup found' };
      }
      
      console.log(`[SupabaseService] Successfully loaded data from cloud for ${userId}`);
      return { success: true, data: data[0].data };
    } catch (err: any) {
      console.error(`[SupabaseService] Fatal load error: ${err.message}`);
      return { success: false, error: err.message };
    }
  },

  wipeAllTenantData: async (tenantId: string) => {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    
    console.log(`[SupabaseService] CAUTION: Wiping all data for tenant: ${tenantId}`);
    
    const tables = [
      'transactions', 'journal_lines', 'journal_entries', 'customers', 
      'suppliers', 'partners', 'employees', 'treasuries', 'currencies', 
      'cost_centers', 'departments', 'designations', 'attendance_logs', 
      'shifts', 'employee_leaves', 'employee_allowances', 
      'employee_documents', 'employee_settlements', 'audit_logs', 'tenant_settings', 'master_trips'
    ];

    const errors: string[] = [];
    
    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).delete().eq('tenant_id', tenantId);
        if (error) {
          console.warn(`[SupabaseService] Wipe warning for ${table}:`, error.message);
          if (!error.message.includes('schema cache')) {
            errors.push(`${table}: ${error.message}`);
          }
        }
      } catch (err: any) {
        console.error(`[SupabaseService] Fatal error wiping ${table}:`, err);
      }
    }

    try {
      const { error: backupError } = await supabase.from('user_backups').delete().eq('user_id', tenantId);
      if (backupError) errors.push(`user_backups: ${backupError.message}`);
    } catch (err: any) {
      errors.push(`user_backups fatal: ${err.message}`);
    }

    if (errors.length > 0) {
      if (errors.every(e => e.includes('schema cache'))) return { success: true };
      return { success: false, error: errors.join(', ') };
    }

    return { success: true };
  },

  getTenants: async () => {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    const { data, error } = await supabase
      .from('tenants')
      .select('name')
      .eq('is_active', true);
    
    if (error) {
      console.error("Error fetching tenants:", error);
      return { success: false, error: error.message };
    }
    return { success: true, data: (data || []).map((t: any) => t.name.toLowerCase()) };
  },

  subscribeToBackups: (userId: string, onUpdate: (newData: any, sessionId?: string, isDelta?: boolean) => void) => {
    if (!supabase) return null;
    const channelName = `user_backups_changes_${userId}`;

    let channel = activeChannels[channelName];
    
    if (channel && channel.state === 'joined') {
      return channel;
    }

    if (channel) channel.unsubscribe();

    channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_backups',
          filter: `user_id=eq.${userId}`
        },
        (payload: any) => {
          if (payload.new && payload.new.data) {
            onUpdate(payload.new.data, payload.new.session_id || payload.new.data.senderSessionId, false);
          }
        }
      )
      .on(
        'broadcast',
        { event: 'delta_sync' },
        (payload: any) => {
          if (payload.payload) {
            onUpdate(payload.payload, payload.payload.senderSessionId, true);
          }
        }
      )
      .subscribe();

    activeChannels[channelName] = channel;
    return channel;
  },

  broadcastDelta: async (userId: string, delta: any) => {
    if (!supabase) return { success: false };
    const channelName = `user_backups_changes_${userId}`;
    
    let channel = activeChannels[channelName];
    if (!channel || channel.state !== 'joined') {
      channel = supabase.channel(channelName);
      await channel.subscribe();
      activeChannels[channelName] = channel;
      await new Promise(r => setTimeout(r, 500));
    }
    
    const res = await channel.send({
      type: 'broadcast',
      event: 'delta_sync',
      payload: { ...delta, isDeltaSync: true },
    });
    
    return { success: res === 'ok' };
  },

  upsertRecords: async (tableName: string, records: any[], tenantId: string) => {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    if (!records || !records.length) return { success: true };

    let allLines: any[] = [];
    if (tableName === 'journal_entries') {
        records.forEach((entry, entryIdx) => {
            if (entry.lines && Array.isArray(entry.lines)) {
                entry.lines.forEach((line: any, lineIdx: number) => {
                    allLines.push({
                        ...mapKeysToSnake(line),
                        id: line.id || `L_${entryIdx}_${lineIdx}`, 
                        tenant_id: tenantId,
                        journal_entry_id: entry.id
                    });
                });
            }
        });
    }

    const uniquePayloadMap = new Map();
    records.forEach(r => {
        const item: any = { ...mapKeysToSnake(r), tenant_id: tenantId };
        delete item.last_updated;
        delete item.updated_at;
        if (tableName === 'transactions') {
            if (item.is_voided === undefined) item.is_voided = false;
        }
        if (tableName === 'journal_entries') delete item.lines;

        const recordId = item.id || (tableName === 'currencies' ? `${tenantId}_${item.code}` : null);
        if (recordId) uniquePayloadMap.set(recordId, item);
    });
    
    const payload = Array.from(uniquePayloadMap.values());
    const { data, error } = await supabase
      .from(tableName)
      .upsert(payload, { onConflict: tableName === 'currencies' ? 'tenant_id,code' : 'id' });
      
    if (error) {
      console.error(`[SupabaseService] Upsert error for ${tableName}:`, error);
      if (error.message.includes('column') || error.message.includes('schema cache') || error.code === '42703') {
          await SupabaseService.reloadSchema();
          await new Promise(r => setTimeout(r, 2000));
          const retry = await supabase.from(tableName).upsert(payload);
          if (!retry.error) return { success: true, data: retry.data };
          console.error(`[SupabaseService] Retry failed for ${tableName}:`, retry.error);
      }
      return { success: false, error: `${error.message} (${error.code || 'NO_CODE'})` };
    }

    if (allLines.length > 0) {
        await supabase.from('journal_lines').upsert(allLines, { onConflict: 'id' });
    }
    return { success: true, data };
  },

  upsertRecord: async (tableName: string, record: any, tenantId: string) => {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    const payload = { ...mapKeysToSnake(record), tenant_id: tenantId };
    const { data, error } = await supabase.from(tableName).upsert(payload);
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  },

  fetchTenantData: async (tableName: string, tenantId: string) => {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    console.log(`[SupabaseService] Fetching ${tableName} for ${tenantId}...`);
    
    let allData: any[] = [];
    let from = 0;
    const pageSize = 1000;
    
    try {
        while (true) {
            const { data, error } = await supabase.from(tableName)
                .select('*')
                .eq('tenant_id', tenantId)
                .range(from, from + pageSize - 1);
                
            if (error) {
                if (error.code === '42P01' || error.message.includes('schema cache')) return { success: true, data: [] };
                return { success: false, error: error.message };
            }
            
            if (!data || data.length === 0) break;
            allData = [...allData, ...data];
            if (data.length < pageSize) break;
            from += pageSize;
        }

        let processedData = allData.map(item => {
            if (item && item.data && typeof item.data === 'object') {
                return { ...mapKeysToCamel(item.data), id: item.id || item.data.id, tenantId: item.tenant_id };
            }
            return mapKeysToCamel(item);
        });
        
        if (tableName === 'journal_entries') {
            processedData = processedData.map((entry: any) => ({
                ...entry,
                lines: entry.journalLines || entry.lines || []
            }));
        } else if (tableName === 'tenant_settings') {
            processedData = processedData.map((s: any) => ({
                ...s,
                companyName: s?.companyName || s?.company_name || 'نِـبـراس ERP',
                logoUrl: s?.logoUrl || s?.logo_url || '',
                ...s?.otherSettings
            }));
        }

        return { success: true, data: processedData };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
  },

  reloadSchema: async () => {
    if (!supabase) return { success: false };
    try {
        const { error } = await supabase.rpc('reload_schema_cache');
        return { success: !error };
    } catch (e) {
        return { success: false };
    }
  },

  upsertTenantSettings: async (tenantId: string, settings: CompanySettings) => {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    const payload = {
        tenant_id: tenantId,
        company_name: settings.companyName || settings.name || "نبراس ERP",
        logo_url: settings.logoUrl || settings.logo,
        base_currency: settings.baseCurrency,
        address: settings.address,
        phone: settings.phone,
        email: settings.email,
        website: settings.website,
        enable_cost_centers: settings.enableCostCenters,
        other_settings: mapKeysToSnake(settings)
    };
    const { data, error } = await supabase.from('tenant_settings').upsert(payload, { onConflict: 'tenant_id' });
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  },

  getDashboardSummary: async (tenantId: string) => {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    const { data, error } = await supabase.rpc('get_dashboard_summary', { p_tenant_id: tenantId });
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  }
};
