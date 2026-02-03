
// SupabaseService.ts - خدمة الربط السحابي
// يمكنك الحصول على هذه البيانات عند إنشاء مشروع على supabase.com
import { createClient } from '@supabase/supabase-js';
import { mapKeysToSnake, mapKeysToCamel } from './utils/caseConversion';
import { CompanyData, CompanySettings } from './types';

// استبدل هذه القيم ببيانات مشروعك الحقيقية
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

const supabase = (SUPABASE_URL && SUPABASE_URL.startsWith('http') && SUPABASE_ANON_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
  : null;

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
  // هذا حل سريع للبدء بدلاً من إنشاء جداول لكل شيء
  saveFullBackup: async (userId: string, fullData: Partial<CompanyData>, sessionId?: string) => {
    if (!supabase) {
      console.error("Supabase client not initialized. Check your environment variables.");
      return { success: false, error: 'Supabase not configured' };
    }
    console.log(`Attempting to save backup for user: ${userId}`);
    
    // محاولة الحفظ مع تحديد أن user_id هو المفتاح للمطابقة
    const payload: any = { 
      user_id: userId, 
      data: fullData, 
      updated_at: new Date()
    };
    
    if (sessionId) payload.session_id = sessionId;

    let { error } = await supabase
      .from('user_backups')
      .upsert(payload, { onConflict: 'user_id' });
    
    // إذا فشل بسبب فقدان عمود session_id، نحاول مرة أخرى بدونه
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
      // استخدام عميل Supabase الرسمي مباشرة لضمان أقصى درجات الاستقرار والأمان
      const { data, error: sbError } = await supabase
        .from('user_backups')
        .select('data')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1);
        
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

  // مسح شامل لكافة بيانات المستأجر من السحاب (جداول و JSON)
  wipeAllTenantData: async (tenantId: string) => {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    
    console.log(`[SupabaseService] CAUTION: Wiping all data for tenant: ${tenantId}`);
    
    const tables = [
      'transactions', 'journal_lines', 'journal_entries', 'customers', 
      'suppliers', 'partners', 'employees', 'treasuries', 'currencies', 
      'cost_centers', 'departments', 'designations', 'attendance_logs', 
      'shifts', 'employee_leaves', 'employee_allowances', 
      'employee_documents', 'audit_logs', 'tenant_settings', 'master_trips'
    ];

    const errors: string[] = [];
    
    // مسح الجداول العلائقية واحداً تلو الآخر لتجنب توقف العملية بالكامل عند فشل أحدها
    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).delete().eq('tenant_id', tenantId);
        if (error) {
          // نتجاهل خطأ عدم وجود الجدول في الكاش حالياً ونكتفي بتسجيله
          console.warn(`[SupabaseService] Wipe warning for ${table}:`, error.message);
          if (!error.message.includes('schema cache')) {
            errors.push(`${table}: ${error.message}`);
          }
        }
      } catch (err: any) {
        console.error(`[SupabaseService] Fatal error wiping ${table}:`, err);
      }
    }

    // مسح النسخة الاحتياطية (JSON Blob)
    try {
      // نستخدم tenant_id بدلاً من user_id لضمان المسح الصحيح
      const { error: backupError } = await supabase.from('user_backups').delete().eq('user_id', tenantId);
      if (backupError) errors.push(`user_backups: ${backupError.message}`);
    } catch (err: any) {
      errors.push(`user_backups fatal: ${err.message}`);
    }

    if (errors.length > 0) {
      console.error("[SupabaseService] Wipe encountered some non-critical errors:", errors);
      // إذا كانت كافة الأخطاء مجرد "schema cache" نعتبر العملية ناجحة
      if (errors.every(e => e.includes('schema cache'))) return { success: true };
      return { success: false, error: errors.join(', ') };
    }

    return { success: true };
  },

  // دالة لجلب قائمة العملاء المشتركين
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

  // دالة للاشتراك في التغييرات اللحظية
  subscribeToBackups: (userId: string, onUpdate: (newData: any, sessionId?: string, isDelta?: boolean) => void) => {
    if (!supabase) return null;
    const channelName = `user_backups_changes_${userId}`;

    // إذا كانت القناة موجودة ومشتركة بالفعل، لا نغلقها، فقط نحدث الـ Callback إذا لزم الأمر
    let channel = activeChannels[channelName];
    
    if (channel && channel.state === 'joined') {
      console.log(`[SupabaseService] Reusing existing joined channel for ${userId}`);
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
          console.log("[SupabaseService] DB Change received");
          if (payload.new && payload.new.data) {
            onUpdate(payload.new.data, payload.new.session_id || payload.new.data.senderSessionId, false);
          }
        }
      )
      .on(
        'broadcast',
        { event: 'delta_sync' },
        (payload: any) => {
          console.log("[SupabaseService] Broadcast delta received");
          if (payload.payload) {
            onUpdate(payload.payload, payload.payload.senderSessionId, true);
          }
        }
      )
      .subscribe((status) => {
        console.log(`[SupabaseService] Subscription status for ${userId}:`, status);
      });

    activeChannels[channelName] = channel;
    return channel;
  },

  // دالة لإرسال تحديث جزئي سريع (Delta) عبر Broadcast
  broadcastDelta: async (userId: string, delta: any) => {
    if (!supabase) return { success: false };
    const channelName = `user_backups_changes_${userId}`;
    
    let channel = activeChannels[channelName];
    // تأكد من أن القناة جاهزة للإرسال
    if (!channel || channel.state !== 'joined') {
      channel = supabase.channel(channelName);
      await channel.subscribe();
      activeChannels[channelName] = channel;
      // ننتظر قليلاً للتأكد من إتمام الربط
      await new Promise(r => setTimeout(r, 500));
    }
    
    const res = await channel.send({
      type: 'broadcast',
      event: 'delta_sync',
      payload: { ...delta, isDeltaSync: true }, // علامة لتمييز التحديث اللحظي
    });
    
    return { success: res === 'ok' };
  },

  // دالة لحفظ مجموعة سجلات دفعة واحدة (أسرع بكثير)
  upsertRecords: async (tableName: string, records: any[], tenantId: string) => {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    if (!records || !records.length) return { success: true };

    // معالجة خاصة للقيود اليومية: استخراج كافة السطور من كافة القيود قبل الحذف (Deduplication)
    let allLines: any[] = [];
    if (tableName === 'journal_entries') {
        records.forEach((entry, entryIdx) => {
            if (entry.lines && Array.isArray(entry.lines)) {
                entry.lines.forEach((line: any, lineIdx: number) => {
                    allLines.push({
                        ...mapKeysToSnake(line),
                        // استخدام مفتاح مركب يضمن عدم التكرار حتى لو تشابهت الـ ID للقيود
                        id: line.id || `L_${entryIdx}_${lineIdx}`, 
                        tenant_id: tenantId,
                        journal_entry_id: entry.id
                    });
                });
            }
        });
    }

    // تحويل البيانات لتناسب أسماء الأعمدة في قاعدة البيانات (snake_case)
    const uniquePayloadMap = new Map();
    
    records.forEach(r => {
        const snakeRecord = mapKeysToSnake(r);
        const item: any = { ...snakeRecord, tenant_id: tenantId };
        
        delete item.last_updated;
        delete item.updated_at;
        
        if (tableName === 'transactions') {
            if (item.is_voided === undefined) item.is_voided = false;
            if (item.is_sale_only === undefined) item.is_sale_only = false;
            if (item.is_purchase_only === undefined) item.is_purchase_only = false;
        }

        if (tableName === 'journal_entries') {
            delete item.lines;
        }

        const recordId = item.id || (tableName === 'currencies' ? `${tenantId}_${item.code}` : null);
        if (recordId) {
            uniquePayloadMap.set(recordId, item);
        }
    });
    
    const payload = Array.from(uniquePayloadMap.values());
    
    const { data, error } = await supabase
      .from(tableName)
      .upsert(payload, { onConflict: tableName === 'currencies' ? 'tenant_id,code' : 'id' });
      
    if (error) {
      console.error(`Error batch upserting to ${tableName}:`, error.message);
      return { success: false, error: error.message };
    }

    // حفظ السطور المستخرجة (إذا وجدت)
    if (allLines.length > 0) {
        const { error: linesError } = await supabase
            .from('journal_lines')
            .upsert(allLines, { onConflict: 'id' });
        
        if (linesError) {
            console.error(`Error upserting journal lines:`, linesError.message);
        }
    }

    return { success: true, data };
  },

  // دالة لحفظ سجل واحد بشكل مستقل لضمان عدم حدوث تضارب
  upsertRecord: async (tableName: string, record: any, tenantId: string) => {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    
    // إضافة tenant_id لضمان العزل بين العملاء وتحويل المفاتيح لـ snake_case
    const payload = { ...mapKeysToSnake(record), tenant_id: tenantId };
    
    const { data, error } = await supabase
      .from(tableName)
      .upsert(payload);
      
    if (error) {
      console.error(`Error upserting to ${tableName}:`, error.message);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  },

  // دالة لجلب البيانات بفلترة الـ tenant_id مع دعم الجلب الكامل (Pagination)
  fetchTenantData: async (tableName: string, tenantId: string) => {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    
    let allData: any[] = [];
    let errorOccurred = false;
    let errorMessage = '';
    let from = 0;
    const pageSize = 1000;
    
    // حلقة تكرارية لجلب كافة السجلات مهما كان عددها
    while (true) {
        let query = supabase.from(tableName).select(tableName === 'journal_entries' ? '*, journal_lines(*)' : '*');
        
        const { data, error } = await query
            .eq('tenant_id', tenantId)
            .range(from, from + pageSize - 1);
            
        if (error) {
            console.error(`Error fetching from ${tableName}:`, error.message);
            errorOccurred = true;
            errorMessage = error.message;
            break;
        }
        
        if (!data || data.length === 0) break;
        
        allData = [...allData, ...data];
        if (data.length < pageSize) break; // وصلنا لآخر البيانات
        from += pageSize;
    }
      
    if (errorOccurred) return { success: false, error: errorMessage };
    
    // تحويل البيانات لتناسب الهيكل المتوقع في التطبيق (تحويل الـ camelCase)
    let processedData = mapKeysToCamel(allData);
    
    if (tableName === 'journal_entries') {
        processedData = processedData.map((entry: any) => ({
            ...entry,
            lines: entry.journalLines || []
        }));
    } else if (tableName === 'tenant_settings') {
        processedData = processedData.map((s: any) => ({
            ...s,
            companyName: s.companyName || s.company_name,
            logoUrl: s.logoUrl || s.logo_url,
            ...s.otherSettings
        }));
    }

    return { success: true, data: processedData };
  },

  // دالة لتحديث كاش قاعدة البيانات في Supabase
  reloadSchema: async () => {
    if (!supabase) return { success: false };
    try {
        // محاولة استدعاء وظيفة مخصصة لتحديث الكاش إذا كانت موجودة
        const { error } = await supabase.rpc('reload_schema_cache');
        if (error) console.warn("Schema reload RPC failed (normal if not defined):", error.message);
        return { success: !error };
    } catch (e) {
        return { success: false };
    }
  },

  // دالة لحفظ إعدادات المستأجر (Tenant Settings)
  upsertTenantSettings: async (tenantId: string, settings: CompanySettings) => {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    
    // تحويل الإعدادات لـ snake_case لضمان توافق الأسماء في حقل other_settings
    const snakeSettings = mapKeysToSnake(settings);
    
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
        other_settings: snakeSettings
    };
    
    const { data, error } = await supabase
        .from('tenant_settings')
        .upsert(payload, { onConflict: 'tenant_id' });
        
    if (error) {
        console.error(`Error upserting tenant settings:`, error.message);
        return { success: false, error: error.message };
    }
    return { success: true, data };
  },

  // دالة لجلب ملخص لوحة التحكم باستخدام الوظيفة الذكية في السحاب
  getDashboardSummary: async (tenantId: string) => {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    
    const { data, error } = await supabase
      .rpc('get_dashboard_summary', { p_tenant_id: tenantId });
      
    if (error) {
      console.error(`Error calling get_dashboard_summary:`, error.message);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  },

  // دالة لجلب سجل الرقابة (Audit Logs) لمدير النظام
  fetchAuditLogs: async (tenantId: string, limit = 100) => {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('timestamp', { ascending: false })
      .limit(limit);
      
    if (error) {
      console.error(`Error fetching audit logs:`, error.message);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  }
};
