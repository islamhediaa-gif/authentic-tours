
// RailwayService.ts - خدمة الربط مع Backend Railway الجديد
import { CompanyData } from './types';
import { SupabaseService } from './SupabaseService';

const API_URL = 'https://authentic-tours-production.up.railway.app';

// Helper to convert string numbers from PostgreSQL/Railway back to actual numbers
export const sanitizeData = (data: any): any => {
  if (Array.isArray(data)) {
    return data.map(sanitizeData);
  }
  if (data !== null && typeof data === 'object') {
    const sanitized: any = {};
    for (const key in data) {
      const val = data[key];
      // Check if value is a string that looks like a number (handle commas)
      if (typeof val === 'string' && val.length > 0 && 
          !key.toLowerCase().includes('id') && 
          !key.toLowerCase().includes('date') &&
          !key.toLowerCase().includes('ref')) {
        
        // Remove commas for numeric check
        const cleanVal = val.replace(/,/g, '');
        if (!isNaN(cleanVal as any) && cleanVal.trim() !== '') {
            sanitized[key] = Number(cleanVal);
        } else {
            sanitized[key] = sanitizeData(val);
        }
      } else {
        sanitized[key] = sanitizeData(val);
      }
    }
    return sanitized;
  }
  return data;
};

export const RailwayService = {
  fetchTenantData: async (tableName: string, tenantId: string) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout

      const response = await fetch(`${API_URL}/api/data/${tableName}?tenant_id=${tenantId}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const res = await response.json();
      if (res.success && res.data) {
        res.data = sanitizeData(res.data);
      }
      return res;
    } catch (error: any) {
      console.error(`[RailwayService] Error fetching ${tableName}:`, error.message);
      return { success: false, error: error.message };
    }
  },

  upsertRecords: async (tableName: string, records: any[], tenantId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/upsert/${tableName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records, tenant_id: tenantId })
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  saveFullBackup: async (userId: string, fullData: Partial<CompanyData>) => {
    try {
      const response = await fetch(`${API_URL}/api/backup/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, data: fullData })
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  loadFullBackup: async (userId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/backup/load/${userId}`);
      const res = await response.json();
      if (res.success && res.data) {
        res.data = sanitizeData(res.data);
      }
      return res;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  wipeAllTenantData: async (tenantId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/wipe/${tenantId}`, {
        method: 'DELETE'
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  upsertTenantSettings: async (tenantId: string, settings: any) => {
    try {
      const response = await fetch(`${API_URL}/api/upsert/tenant_settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: [settings], tenant_id: tenantId })
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Proxy realtime methods to Supabase for now to maintain cross-device sync
  broadcastDelta: async (userId: string, delta: any) => {
    return await SupabaseService.broadcastDelta(userId, delta);
  },

  subscribeToBackups: (userId: string, onUpdate: (newData: any, sessionId?: string, isDelta?: boolean) => void) => {
    return SupabaseService.subscribeToBackups(userId, onUpdate);
  },

  getDashboardSummary: async (tenantId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/dashboard/summary?tenant_id=${tenantId}`);
      const res = await response.json();
      if (res.success && res.data) {
        res.data = sanitizeData(res.data);
      }
      return res;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  fetchAuditLogs: async (tenantId: string, limit = 100) => {
    try {
      const response = await fetch(`${API_URL}/api/data/audit_logs?tenant_id=${tenantId}&limit=${limit}`);
      const res = await response.json();
      if (res.success && Array.isArray(res.data)) {
        // Sort by timestamp descending
        res.data.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      }
      return res;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};
