// DataService.ts - الوسيط الموحد للتعامل مع البيانات باستخدام IndexedDB
import { User, CompanySettings, CompanyData } from './types';
import { mapKeysToCamel } from './utils/caseConversion';
import { CONFIG } from './config';

const isElectron = typeof window !== 'undefined' && (
  !!(window as any).process?.versions?.electron ||
  navigator.userAgent.toLowerCase().includes('electron')
);

// إعداد IndexedDB
const DB_NAME = 'NebrasDB_v16';
const STORE_NAME = 'enterprise_data_v16';
const DB_VERSION = 16; 

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
  
  const validateTenant = (id: any): string => {
    if (!id || typeof id !== 'string') return 'authentic';
    const cleanId = id.trim().toLowerCase();
    if (cleanId === 'null' || cleanId === 'undefined' || cleanId === '') return 'authentic';
    return cleanId;
  };

  if (client) {
    const mapped = validateTenant(client);
    try {
      localStorage.setItem('nebras_tenant_id', mapped);
    } catch (e) {}
    return mapped;
  }
  
  let saved = 'authentic';
  try {
    saved = localStorage.getItem('nebras_tenant_id') || 'authentic';
  } catch (e) {}
  
  return validateTenant(saved);
};

const getClientName = () => {
  const tenantId = getTenantId();
  if (tenantId === 'authentic' || tenantId === 'server') return 'نِـبـراس ERP';
  if (!tenantId || typeof tenantId !== 'string') return 'نِـبـراس ERP';
  return tenantId.charAt(0).toUpperCase() + tenantId.slice(1);
};

// Dummy service to replace cloud logic
const DummyCloudService = {
  broadcastDelta: async () => ({ success: false }),
  subscribeToBackups: () => null,
  getTenants: async () => ({ success: true, data: [] }),
  wipeAllTenantData: async () => ({ success: true }),
  getDashboardSummary: async () => ({ success: false, error: "Not implemented" }),
  fetchAuditLogs: async () => ({ success: true, data: [] }),
  loadFullBackup: async () => ({ success: false }),
  fetchTenantData: async () => ({ success: true, data: [] }),
  saveFullBackup: async () => ({ success: true }),
  saveIncrementalData: async () => ({ success: true })
};

// إعدادات الـ API
const API_BASE_URL = CONFIG.API_BASE_URL;

export const DataService = {
  getTenantId,
  getClientName,
  
  broadcastDelta: async (userId: string, delta: any) => {
    return { success: false };
  },

  subscribeToBackups: (userId: string, onUpdate: (newData: any, sessionId?: string, isDelta?: boolean) => void) => {
    return null;
  },

  getTenants: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      if (response.ok) return { success: true, data: [] };
      return { success: false };
    } catch (e) {
      return { success: false };
    }
  },

  wipeAllTenantData: async (tenantId: string) => {
    return { success: true };
  },

  getDashboardSummary: async (tenantId: string) => {
    return { success: false, error: "Local calculation preferred for now" };
  },

  fetchAuditLogs: async (tenantId: string, limit = 100) => {
    return { success: true, data: [] };
  },
  
  syncWithServer: async (data: CompanyData) => {
    const tenantId = getTenantId();
    try {
      console.log(`[DataService] Syncing data to server for tenant: ${tenantId}`);
      const response = await fetch(`${API_BASE_URL}/api/admin/super-restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, tenant_id: tenantId })
      });
      const result = await response.json();
      return result.success;
    } catch (e) {
      console.error("[DataService] Sync failed:", e);
      return false;
    }
  },

  loadData: async () => {
    const tenantId = getTenantId();
    console.log(`[DataService] loadData called for tenant: ${tenantId}`);
    
    // 1. Try to load from Server first for Web
    if (!isElectron) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/data-all?tenant_id=${tenantId}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            console.log("[DataService] Data loaded from server successfully");
            // Map keys if necessary or use directly
            // Note: super-restore expects a specific format, we might need to adapt it
            return { success: true, data: result.data, source: 'server' };
          }
        }
      } catch (e) {
        console.warn("[DataService] Server fetch failed, falling back to local:", e);
      }
    }

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
        return localRes;
      }
    }
    
    // 2. Web mode - Fallback to IndexedDB
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
    } catch (e) {
      console.warn("[DataService] IndexedDB read failed:", e);
    }

    if (localData) {
        return { 
          success: true, 
          data: localData,
          source: 'local'
        };
    }

    return { success: true, data: { lastUpdated: new Date().toISOString() } };
  },

  saveData: async (data: CompanyData, sessionId?: string, onlyLocal = false, force = false) => {
    const tenantId = getTenantId();
    
    if (!data.lastUpdated) {
      data.lastUpdated = new Date().toISOString();
    }
    
    // 1. Save to IndexedDB
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      await store.put(data, `full_backup_${tenantId}`);
    } catch (e) {
      console.error("[DataService] IndexedDB save failed:", e);
    }

    // 2. Save to Electron if applicable
    if (isElectron && !onlyLocal) {
      const win = window as any;
      const ir = win.require ? win.require('electron').ipcRenderer : (win.electron ? win.electron.ipcRenderer : null);
      if (ir) {
        await ir.invoke('db-save', data);
      }
    }

    // 3. Sync to Server if not Electron and not onlyLocal
    if (!isElectron && !onlyLocal) {
      console.log("[DataService] Triggering immediate sync to server...");
      DataService.syncWithServer(data).then(success => {
        if (success) console.log("[DataService] Sync successful ✅");
        else console.warn("[DataService] Sync failed ❌ - Check server connection");
      });
    }
    
    return { success: true };
  }
};
