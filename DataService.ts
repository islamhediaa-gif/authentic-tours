
// DataService.ts - الوسيط الموحد للتعامل مع البيانات باستخدام IndexedDB للمساحات الكبيرة
import { User, CompanySettings, CompanyData } from './types';
import { SupabaseService } from './SupabaseService';
import { RailwayService, sanitizeData } from './RailwayService';
import { mapKeysToCamel } from './utils/caseConversion';

// اختيار الخدمة السحابية بناءً على المستأجر (Hybrid Cloud Logic)
export const getCloudService = () => {
  const tenantId = getTenantId();
  // authentic يذهب دائماً إلى Railway، الباقي يذهب إلى Supabase
  return (tenantId === 'authentic') ? RailwayService : SupabaseService;
};

const isUsingRailway = () => getCloudService() === RailwayService;

const isElectron = typeof window !== 'undefined' && (
  !!(window as any).process?.versions?.electron ||
  navigator.userAgent.toLowerCase().includes('electron')
);

// إعداد IndexedDB
const DB_NAME = 'NebrasDB';
const STORE_NAME = 'enterprise_data';
const DB_VERSION = 2; // رفع الإصدار لإجبار المتصفح على التحديث

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
        console.log(`[IndexedDB] Store "${STORE_NAME}" created successfully.`);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const getTenantId = () => {
  if (typeof window === 'undefined') return 'server';
  const params = new URLSearchParams(window.location.search);
  let client = params.get('client');
  
  // إجبار الجميع على استخدام authentic إذا حاولوا استخدام الروابط القديمة
  const forceAuthentic = (id: string) => {
    const oldTenants = ['osntic', 'nebras', 'samar', 'nada', 'hedia', 'islam-hedia', 'default'];
    return oldTenants.includes(id.toLowerCase()) ? 'authentic' : id;
  };

  if (client) {
    const mapped = forceAuthentic(client);
    localStorage.setItem('nebras_tenant_id', mapped);
    return mapped;
  }
  
  const saved = localStorage.getItem('nebras_tenant_id') || 'authentic';
  return forceAuthentic(saved);
};

const getClientName = () => {
  const tenantId = getTenantId();
  if (tenantId === 'authentic' || tenantId === 'server') return 'نِـبـراس ERP';
  return tenantId.charAt(0).toUpperCase() + tenantId.slice(1);
};

export const DataService = {
  getTenantId,
  getClientName,
  
  broadcastDelta: async (userId: string, delta: any) => {
    const service = getCloudService();
    if ((service as any).broadcastDelta) {
      return await (service as any).broadcastDelta(userId, delta);
    }
    // Fallback to Supabase for broadcasting if Railway doesn't support it yet
    // but only if we really need realtime. For now, let's keep it clean.
    return { success: false };
  },

  subscribeToBackups: (userId: string, onUpdate: (newData: any, sessionId?: string, isDelta?: boolean) => void) => {
    const service = getCloudService();
    if ((service as any).subscribeToBackups) {
      return (service as any).subscribeToBackups(userId, onUpdate);
    }
    return null;
  },

  getTenants: async () => {
    // This is usually global, so we can stick to Supabase or use the current service
    // But since it's used to list ALL tenants, Supabase is better if Railway is tenant-specific
    return await SupabaseService.getTenants();
  },

  wipeAllTenantData: async (tenantId: string) => {
    return await getCloudService().wipeAllTenantData(tenantId);
  },

  getDashboardSummary: async (tenantId: string) => {
    const service = getCloudService();
    if ((service as any).getDashboardSummary) {
      return await (service as any).getDashboardSummary(tenantId);
    }
    // Fallback to fetching all data and calculating locally if RPC not available
    return { success: false, error: "Dashboard RPC not supported on this service" };
  },

  fetchAuditLogs: async (tenantId: string, limit = 100) => {
    const service = getCloudService();
    if ((service as any).fetchAuditLogs) {
      return await (service as any).fetchAuditLogs(tenantId, limit);
    }
    // Fallback for services that don't have specialized audit log fetching
    return await service.fetchTenantData('audit_logs', tenantId);
  },
  
  loadData: async () => {
    const tenantId = getTenantId();
    console.log(`[DataService] loadData called for tenant: ${tenantId}, isElectron: ${isElectron}`);
    
    if (isElectron) {
      const win = window as any;
      let ir = null;
      if (win.require) {
        ir = win.require('electron').ipcRenderer;
      } else if (win.electron && win.electron.ipcRenderer) {
        ir = win.electron.ipcRenderer;
      } else if (typeof require !== 'undefined') {
        ir = require('electron').ipcRenderer;
      }

      if (ir) {
        let localRes = await ir.invoke('db-load');
        if (localRes.success && localRes.data && tenantId === 'authentic') {
          localRes.data = sanitizeData(localRes.data);
        }
        
        // محاولة جلب نسخة أحدث من السحاب حتى في وضع الديسكتوب لضمان المزامنة
        try {
          console.log(`[DataService] Electron mode: checking cloud for tenant: ${tenantId}`);
          const cloudRes = await getCloudService().loadFullBackup(tenantId);
          if (cloudRes.success && cloudRes.data) {
            // مقارنة الطوابع الزمنية لضمان عدم الكتابة فوق بيانات محلية أحدث
            const localDate = localRes.data?.lastUpdated ? new Date(localRes.data.lastUpdated).getTime() : 0;
            const cloudDate = cloudRes.data.lastUpdated ? new Date(cloudRes.data.lastUpdated).getTime() : 0;

            if (cloudDate >= localDate || tenantId === 'authentic') {
              // إضافة حماية إضافية: لو الداتا السحابية حجمها أصغر بكتير من المحلية، لا تستبدلها
              // EXCEPT for authentic where we just did a reset
              const localTxCount = localRes.data?.transactions?.length || 0;
              const cloudTxCount = cloudRes.data?.transactions?.length || 0;
              
              if (tenantId !== 'authentic' && cloudTxCount < localTxCount * 0.5 && localTxCount > 10) {
                console.warn(`[DataService] Cloud data looks suspiciously smaller than local (${cloudTxCount} vs ${localTxCount}). Keeping local.`);
                return localRes;
              }

              console.log(`[DataService] Found newer or equal cloud backup in Electron mode, preferring cloud`);
              return { success: true, data: cloudRes.data, machineId: localRes.machineId, fromCloud: true };
            } else {
              console.log(`[DataService] Local data is newer than cloud, using local`);
              return localRes;
            }
          }
        } catch (cloudErr) {
          console.error("[DataService] Failed to fetch cloud backup in Electron:", cloudErr);
        }
        return localRes;
      } else {
        console.error("[DataService] Failed to find ipcRenderer in Electron environment");
      }
    }
    
    // Fallback or Web mode
    console.log(`[DataService] Attempting to load for ${tenantId}...`);
    
    // محاولة جلب نسخة سحابية أولاً للمقارنة (Web Mode)
    let cloudRes: any = { success: false };
    try {
      cloudRes = await getCloudService().loadFullBackup(tenantId);
    } catch (err) {
      console.warn("[DataService] Cloud fetch failed:", err);
    }

    // محاولة التحميل من IndexedDB أولاً للمقارنة
    let localData: any = null;
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(`full_backup_${tenantId}`);
      localData = await new Promise((resolve) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null);
      });

      if (localData && tenantId === 'authentic') {
        localData = sanitizeData(localData);
      }

      if (!localData && (tenantId === 'authentic' || tenantId === 'server')) {
        const oldRequest = store.get('full_backup');
        localData = await new Promise((resolve) => {
          oldRequest.onsuccess = () => resolve(oldRequest.result);
          oldRequest.onerror = () => resolve(null);
        });
        if (localData && tenantId === 'authentic') {
          localData = sanitizeData(localData);
        }
      }
    } catch (e) {
      console.warn("[DataService] IndexedDB read failed:", e);
    }

    const loadRelationalAndReturn = async () => {
      try {
        console.log(`[DataService] Loading all relational data for ${tenantId}...`);
        const criticalTables = ['tenant_settings', 'users', 'currencies'];
        const essentialTables = ['customers', 'suppliers', 'transactions', 'journal_entries', 'journal_lines', 'treasuries', 'programs'];
        const optionalTables = ['partners', 'employees', 'cost_centers', 'departments', 'designations', 'attendance_logs', 'shifts', 'employee_leaves', 'employee_allowances', 'employee_documents', 'audit_logs', 'master_trips'];

        const results = [];
        const allTables = [...criticalTables, ...essentialTables, ...optionalTables];
        
        for (const table of allTables) {
            try {
                const isOptional = optionalTables.includes(table);
                const isCritical = criticalTables.includes(table);
                const timeoutLimit = isCritical ? 12000 : (isOptional ? 3000 : 8000); 
                const tablePromise = getCloudService().fetchTenantData(table, tenantId);
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeoutLimit));
                const res = await Promise.race([tablePromise, timeoutPromise]) as any;
                results.push(res);
            } catch (err) {
                results.push({ success: false, error: 'Timeout' });
            }
        }

        const mergedData: CompanyData = { ...cloudRes.data };
        let hasRealCloudData = false;

        results.forEach((res, index) => {
            const tableName = allTables[index];
            let fieldName: string = tableName;
            if (tableName === 'journal_entries') fieldName = 'journalEntries';
            if (tableName === 'transactions') fieldName = 'transactions';
            if (tableName === 'cost_centers') fieldName = 'costCenters';
            if (tableName === 'attendance_logs') fieldName = 'attendanceLogs';
            if (tableName === 'employee_leaves') fieldName = 'leaves';
            if (tableName === 'employee_allowances') fieldName = 'allowances';
            if (tableName === 'employee_documents') fieldName = 'documents';
            if (tableName === 'audit_logs') fieldName = 'auditLogs';
            if (tableName === 'tenant_settings') fieldName = 'settings';
            if (tableName === 'master_trips') fieldName = 'masterTrips';

            if (res.success && res.data) {
                let mappedData = res.data;
                if (Array.isArray(mappedData)) {
                    if (mappedData.length > 0) hasRealCloudData = true;
                    mappedData = mappedData.map((item: any) => mapKeysToCamel(item));
                }
                if (tableName === 'journal_entries') (mergedData as any).journalEntries = mappedData;
                else if (tableName === 'journal_lines') (mergedData as any)._allJournalLines = mappedData;
                else if (tableName === 'tenant_settings') (mergedData as any)[fieldName] = mappedData && mappedData.length > 0 ? mappedData[0] : (cloudRes.data.settings || {});
                else (mergedData as any)[fieldName] = mappedData;
            } else if (!(mergedData as any)[fieldName]) {
                (mergedData as any)[fieldName] = fieldName === 'settings' ? {} : [];
            }
        });

        // إذا لم نجد بيانات حقيقية في السحاب، نعتمد على البيانات المحلية ولا نستبدلها ببيانات فارغة
        if (!hasRealCloudData && localData) {
            console.log("[DataService] Cloud fetch returned no relational records, keeping local data.");
            return localData;
        }

        if ((mergedData as any).journalEntries) {
            const allLines = (mergedData as any)._allJournalLines || [];
            (mergedData as any).journalEntries = (mergedData as any).journalEntries.map((entry: any) => {
                const entryLines = (entry.lines && entry.lines.length > 0) ? entry.lines : allLines.filter((l: any) => l.journalEntryId === entry.id);
                return { ...entry, lines: entryLines };
            });
            delete (mergedData as any)._allJournalLines;
        }
        return mergedData;
      } catch (e) {
        console.error("Relational load failed", e);
        return cloudRes.data || localData;
      }
    };

      if (cloudRes.success && cloudRes.data) {
        // تشغيل عملية جلب البيانات التفصيلية في الخلفية كـ Promise
        const cloudDataPromise = loadRelationalAndReturn();

        // حماية إضافية: لو الداتا المحلية فارغة تماماً (أصفار)، لا ترجعها فوراً وانتظر السحاب
        const isLocalDataEmpty = !localData || 
                                 (!localData.transactions?.length && !localData.journalEntries?.length);

        if (tenantId === 'authentic' && localData && !isLocalDataEmpty) {
          // السماح بالتحميل الفوري من الذاكرة المحلية لسرعة التشغيل
          // مع إرجاع الوعد السحابي لتحديث الإعدادات والبيانات في الخلفية
          console.log("[DataService] Authentic tenant: Using local cache for instant start...");
          return { 
            success: true, 
            data: localData, 
            fromCloud: false, 
            isStale: true, 
            cloudPromise: cloudDataPromise 
          };
        }
        
        // إجبار نسخة Authentic على انتظار البيانات السحابية إذا كانت المحلية فارغة
        if (tenantId === 'authentic' && isLocalDataEmpty) {
          console.log("[DataService] Authentic local data is empty, MUST wait for cloud data...");
          const fullCloudData = await cloudDataPromise;
          return { success: true, data: fullCloudData, fromCloud: true };
        }

        console.log("[DataService] Local data empty or not Authentic, waiting for cloud fetch...");
        const fullCloudData = await cloudDataPromise;
        if (cloudRes) cloudRes.data = fullCloudData;
        return { success: true, data: fullCloudData, fromCloud: true };
      }
    
    if (localData) {
      console.log(`[DataService] Cloud load failed or empty, using local data`);
      return { success: true, data: localData };
    }
    
    // إذا وصلنا هنا وفشل كل شيء لنسخة Authentic، نحاول محاولة أخيرة لجلب أي بيانات
    if (tenantId === 'authentic') {
       console.log("[DataService] Final attempt for Authentic data...");
       const finalData = await loadRelationalAndReturn();
       if (finalData) return { success: true, data: finalData, fromCloud: true };
    }

    return { success: false, error: 'No data found' };
  },

  saveData: async (data: CompanyData, sessionId?: string, onlyLocal = false, force = false) => {
    // تحديث الطابع الزمني لضمان أن هذه النسخة هي الأحدث والأولوية لها في المزامنة
    if (!data.lastUpdated) {
      data.lastUpdated = new Date().toISOString();
    }
    
    // NUCLEAR GUARD: Prevent wiping the database if data is empty or suspiciously small
    const txCount = data.transactions?.length || 0;
    const jeCount = data.journalEntries?.length || 0;
    
    // We only block cloud saving if it's empty AND we are NOT in a fresh setup state
    // If force is true, we bypass the guard (used after intentional Nuclear Wipe)
    if (!onlyLocal && !force && txCount === 0 && jeCount === 0) {
       // Check if cloud relational tables actually HAVE data before blocking. 
       // We check transactions table as the primary indicator of real data.
       const tenantId = getTenantId();
       try {
         const cloudTx = await getCloudService().fetchTenantData('transactions', tenantId);
         const cloudJE = await getCloudService().fetchTenantData('journal_entries', tenantId);
         const cloudTxCount = cloudTx.data?.length || 0;
         const cloudJECount = cloudJE.data?.length || 0;

         if ((cloudTx.success || cloudJE.success) && (cloudTxCount > 5 || cloudJECount > 5)) {
            console.error("[DataService] CRITICAL: Attempted to save empty data to cloud while relational tables have data. BLOCKING.");
            return { success: true, cloud: false, error: "تم حظر المزامنة السحابية لأن البيانات تبدو فارغة بينما السحاب يحتوي على بيانات فعلية. استخدم 'إصلاح المزامنة' إذا كنت تقصد البدء من جديد." };
         }
       } catch (e) {
         console.warn("[DataService] Guard check failed, assuming safe to block if empty", e);
         return { success: true, cloud: false, error: "تم حظر المزامنة السحابية لأن البيانات تبدو فارغة لمنع المسح الخطأ" };
       }
    }

    let localSuccess = false;
    let localError = "";
    
    // تحديث طابع الوقت دائماً عند الحفظ لضمان أن هذه النسخة هي الأحدث سحابياً ومحلياً
    data.lastUpdated = new Date().toISOString();
    
    // محاولة الحفظ في Electron أولاً إذا توفرت البيئة
    if (isElectron) {
      try {
        const win = window as any;
        let ir = null;
        if (win.require) ir = win.require('electron').ipcRenderer;
        else if (win.electron?.ipcRenderer) ir = win.electron.ipcRenderer;
        else if (typeof require !== 'undefined') ir = require('electron').ipcRenderer;

        if (ir) {
          const res = await ir.invoke('db-save', data);
          localSuccess = res.success;
          if (!res.success) localError = res.error || "خطأ في محرك الحفظ للديسكتوب";
        }
      } catch (e: any) {
        console.warn("Electron save attempted but failed, falling back to Web mode:", e);
      }
    }

    // إذا لم تكن بيئة Electron أو فشلت، نستخدم IndexedDB (للمتصفح أو كبديل)
    if (!localSuccess) {
      try {
        const tenantId = getTenantId();
        localStorage.removeItem('nebras_web_db');
        const db = await openDB();
        
        await new Promise((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          const request = store.put(data, `full_backup_${tenantId}`);
          
          tx.oncomplete = () => resolve(true);
          tx.onerror = () => reject(tx.error);
          request.onerror = () => reject(request.error);
        });
        
        localSuccess = true;
      } catch (err: any) {
        console.error("Web Save (IndexedDB) failed:", err);
        localError = err?.message || "تعذر الوصول لمساحة التخزين في المتصفح";
        localSuccess = false;
      }
    }
    
    if (!localSuccess) return { success: false, error: localError || "فشل الحفظ المحلي" };
    if (onlyLocal) return { success: true, cloud: false };

    try {
      const tenantId = getTenantId();
      
      // 0. تحديث كاش قاعدة البيانات لضمان التعرف على الأعمدة الجديدة (فقط لـ Supabase)
      if (!isUsingRailway()) {
        await (SupabaseService as any).reloadSchema();
        // إضافة تأخير بسيط لإعطاء Supabase فرصة لتحديث الكاش داخلياً
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // 1. مسح البيانات القديمة أولاً إذا كان الرفع إجبارياً
      if (force) {
        console.log(`[DataService] Force save: Wiping existing data for ${tenantId}...`);
        await DataService.wipeAllTenantData(tenantId);
        await getCloudService().saveFullBackup(tenantId, data);
      }

      // 2. مزامنة الجداول بشكل متتابع حقيقي (True Sequential Sync)
      // هذا المنطق يضمن عدم إرسال طلب جديد إلا بعد نجاح الطلب السابق
      
      const syncTable = async (name: string, records: any[], size = 100) => {
        if (!records || records.length === 0) return;
        console.log(`[DataService] Syncing ${records.length} records to ${name}...`);
        for (let i = 0; i < records.length; i += size) {
            const res = await getCloudService().upsertRecords(name, records.slice(i, i + size), tenantId);
            if (!res.success) throw new Error(`Failed to sync ${name}: ${res.error}`);
        }
      };

      try {
        await syncTable('transactions', data.transactions || [], 50);
        await syncTable('customers', data.customers || []);
        await syncTable('suppliers', data.suppliers || []);
        await syncTable('partners', data.partners || []);
        await syncTable('employees', data.employees || []);
        await syncTable('treasuries', data.treasuries || []);
        await syncTable('currencies', data.currencies || []);
        await syncTable('cost_centers', data.costCenters || []);
        await syncTable('departments', data.departments || []);
        await syncTable('designations', data.designations || []);
        await syncTable('master_trips', data.masterTrips || []);
        await syncTable('attendance_logs', data.attendanceLogs || [], 100);
        await syncTable('audit_logs', data.auditLogs || [], 100);
        await syncTable('shifts', data.shifts || []);
        await syncTable('employee_leaves', data.leaves || []);
        await syncTable('employee_allowances', data.allowances || []);
        await syncTable('employee_documents', data.documents || []);
        
        if (data.journalEntries) {
            // Extract all journal lines to ensure full sync even with duplicate JE IDs
            const allLines: any[] = [];
            data.journalEntries.forEach((entry: any, entryIdx: number) => {
                if (entry.lines && Array.isArray(entry.lines)) {
                    entry.lines.forEach((line: any, lineIdx: number) => {
                        allLines.push({
                            ...line,
                            // Ensure unique ID for the line regardless of duplicate entries
                            id: line.id || `L_${entryIdx}_${lineIdx}`,
                            journal_entry_id: entry.id
                        });
                    });
                }
            });

            await syncTable('journal_entries', data.journalEntries, 50);
            await syncTable('journal_lines', allLines, 100);
        }

        if (data.settings) {
            await getCloudService().upsertTenantSettings(tenantId, data.settings);
        }
      } catch (syncErr: any) {
        console.error("[DataService] Critical Sync Error:", syncErr);
        return { success: true, cloud: false, error: `فشل رفع الجداول: ${syncErr.message}` };
      }

      // إنشاء نسخة مخففة من البيانات للحفظ كـ Blob
      const cloudData = { ...data };
      
      // إزالة البيانات الضخمة التي تم حفظها بالفعل في جداول منفصلة لتقليل حجم الـ Blob وتحسين الأداء
      delete (cloudData as any).transactions;
      delete (cloudData as any).journalEntries;
      delete (cloudData as any).customers;
      delete (cloudData as any).suppliers;
      delete (cloudData as any).partners;
      delete (cloudData as any).employees;
      delete (cloudData as any).auditLogs; 
      delete (cloudData as any).attendanceLogs; 
      delete (cloudData as any).shifts;
      delete (cloudData as any).leaves;
      delete (cloudData as any).allowances;
      delete (cloudData as any).documents;
      delete (cloudData as any).costCenters;
      delete (cloudData as any).departments;
      delete (cloudData as any).designations;
      delete (cloudData as any).masterTrips;
      delete (cloudData as any).settings;
      
      const cloudRes = await getCloudService().saveFullBackup(tenantId, cloudData as any);
      return cloudRes.success ? { success: true, cloud: true } : { success: true, cloud: false, error: cloudRes.error };
    } catch (err: any) {
      console.error("Cloud save failed:", err);
      return { success: true, cloud: false, error: "فشل الاتصال بالسحابة" };
    }
  },

  autoBackup: async (data: any) => {
    if (isElectron) {
      try {
        const win = window as any;
        let ir = null;
        if (win.require) ir = win.require('electron').ipcRenderer;
        else if (win.electron?.ipcRenderer) ir = win.electron.ipcRenderer;
        else if (typeof require !== 'undefined') ir = require('electron').ipcRenderer;

        if (ir) {
          return await ir.invoke('db-auto-backup', data);
        }
      } catch (e) {
        console.error("Auto-backup failed:", e);
      }
    }
    return { success: false };
  }
};
